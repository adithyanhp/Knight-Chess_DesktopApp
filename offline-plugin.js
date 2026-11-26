import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

async function publicFiles(directory, prefix = "") {
  if (!directory) return [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const results = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory())
      results.push(
        ...(await publicFiles(
          path.join(directory, entry.name),
          `${relative}/`,
        )),
      );
    else if (entry.isFile() && relative !== "sw.js")
      results.push({
        name: relative,
        content: await readFile(path.join(directory, entry.name)),
      });
  }
  return results;
}

/** Emits the complete production asset inventory, including Vite worker chunks. */
export default function offlinePlugin() {
  let config;
  return {
    name: "knight-offline",
    apply: "build",
    enforce: "post",
    configResolved(resolved) {
      config = resolved;
    },
    generateBundle: {
      order: "post",
      async handler(_options, bundle) {
        const content = new Map();
        for (const [name, output] of Object.entries(bundle)) {
          if (name !== "sw.js")
            content.set(
              name,
              output.type === "chunk" ? output.code : output.source,
            );
        }
        for (const file of await publicFiles(config.publicDir))
          content.set(file.name, file.content);
        if (!content.has("index.html"))
          this.error("Knight offline caching requires a built index.html.");
        const names = [...content.keys()].sort();
        const digest = createHash("sha256");
        for (const name of names) {
          digest.update(name);
          digest.update(content.get(name));
        }
        // Worker logic changes also get a new cache, even if app assets do not.
        digest.update(
          serviceWorkerSource({
            version: "__VERSION__",
            precache: [],
            entryScripts: [],
          }),
        );
        const version = digest.digest("hex").slice(0, 20);
        const base = config.base === "./" || !config.base ? "./" : config.base;
        const precache = [
          ...new Set([base, ...names.map((name) => `${base}${name}`)]),
        ];
        const entryScripts = Object.values(bundle)
          .filter((output) => output.type === "chunk" && output.isEntry)
          .map((output) => output.fileName);
        this.emitFile({
          type: "asset",
          fileName: "sw.js",
          source: serviceWorkerSource({ version, precache, entryScripts }),
        });
      },
    },
  };
}

function serviceWorkerSource({ version, precache, entryScripts }) {
  return `/* Knight offline app shell. Generated from the production build. */
const VERSION = ${JSON.stringify(version)};
const CACHE_PREFIX = 'knight-offline-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE_NAME = CACHE_PREFIX + VERSION;
const PRECACHE = ${JSON.stringify(precache)}.map(value => new URL(value, self.registration.scope).href);
const ASSETS = new Set(PRECACHE);
const ENTRY_SCRIPTS = ${JSON.stringify(entryScripts)};
const SHELL_URL = new URL('index.html', self.registration.scope).href;

function sensitiveRequest(request, url) {
  const relative = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  return request.headers.has('authorization')
    || /^(api|admin|auth|accounts|oauth|login|logout|signin|signout|register|media|uploads|cdn-cgi|_auth|_openai|\\.well-known)(\\/|$)/i.test(relative)
    || [...url.searchParams.keys()].some(key => /^(token|access_token|refresh_token|code|session|password)$/i.test(key));
}

async function cacheable(response, url, shell = false) {
  if (!response || !response.ok || response.redirected || response.type === 'opaque' || response.type === 'opaqueredirect') return false;
  if (response.url && new URL(response.url).origin !== self.location.origin) return false;
  const type = response.headers.get('content-type') || '';
  if (shell) {
    if (!type.includes('text/html')) return false;
    // A sign-in page or a different build must never overwrite this app shell.
    const html = await response.clone().text();
    return ENTRY_SCRIPTS.length > 0 && ENTRY_SCRIPTS.every(name => html.includes(name));
  }
  const pathname = new URL(url, self.registration.scope).pathname;
  if (/\\.m?js$/i.test(pathname)) return /javascript|ecmascript/i.test(type);
  if (/\\.css$/i.test(pathname)) return type.includes('text/css');
  if (/\\.svg$/i.test(pathname)) return type.includes('image/svg+xml');
  if (/\\.(png|jpe?g|webp|gif|avif|ico)$/i.test(pathname)) return type.startsWith('image/');
  // Do not cache HTML authentication pages returned in place of another asset.
  return !type.includes('text/html');
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const failed = [];
    await Promise.all(PRECACHE.map(async url => {
      try {
        const request = new Request(url, { credentials: 'same-origin', cache: 'reload' });
        if (sensitiveRequest(request, new URL(url))) { failed.push(url); return; }
        const response = await fetch(request);
        const pathname = new URL(url).pathname;
        const isShell = pathname.endsWith('/') || pathname.endsWith('/index.html');
        if (!await cacheable(response, url, isShell)) { failed.push(url); return; }
        await cache.put(url, response);
      } catch { failed.push(url); }
    }));
    if (failed.length) {
      // Keep the previous working worker if an update cannot be cached in full.
      await caches.delete(CACHE_NAME);
      throw new Error('Knight offline installation could not cache all app assets.');
    }
    // Updates activate after existing tabs close, avoiding mixed build assets.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || sensitiveRequest(request, url)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        // Return real HTTP and authentication responses. Offline fallback only
        // applies to a failed network request, never to an access denial.
        try {
          if (await cacheable(response, url.href, true)) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(SHELL_URL, response.clone());
          }
        } catch { /* A storage failure must not hide a successful network page. */ }
        return response;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        const shell = await cache.match(SHELL_URL);
        return shell || new Response('Open Knight once while online to enable offline play.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }
  url.search = '';
  if (!ASSETS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url.href);
    if (cached) return cached;
    const response = await fetch(request);
    if (await cacheable(response, url.href)) await cache.put(url.href, response.clone());
    return response;
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'KNIGHT_OFFLINE_STATUS' || !event.ports?.[0]) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    event.ports[0].postMessage({ ready: Boolean(await cache.match(SHELL_URL)), version: VERSION });
  })());
});
`;
}
