'use strict';
const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

let mainWindow, settingsWindow, server;
const PORT_HOST = '127.0.0.1';
const DIST = path.join(__dirname, '..', 'dist');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.webp':'image/webp' };
function settingsFile() { return path.join(app.getPath('userData'), 'knight-desktop.json'); }
function getSettings() { try { return JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); } catch { return {}; } }
function normalizeApi(input) {
  const text = String(input || '').trim().replace(/\/+$/, '');
  if (!text) return '';
  const parsed = new URL(text);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) throw new Error('Use HTTPS for hosted servers. HTTP is allowed only for localhost.');
  if (parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error('Enter only the Render server address, with /api at the end.');
  if (parsed.pathname !== '/' && parsed.pathname !== '/api') throw new Error('The URL should end with /api or have no path.');
  return `${parsed.origin}/api`;
}
function currentApi() { try { return normalizeApi(getSettings().apiUrl || ''); } catch { return ''; } }

function proxyApi(req, res, apiBase) {
  const endpoint = new URL(req.url.replace(/^\/api\/?/, ''), apiBase + '/');
  // Do not permit an outbound request to a host different from the configured backend.
  if (endpoint.origin !== new URL(apiBase).origin) { res.writeHead(400); res.end('Bad path'); return; }
  const transport = endpoint.protocol === 'https:' ? https : http;
  const outbound = transport.request(endpoint, { method: req.method, headers: { ...req.headers, host: endpoint.host, origin: undefined, referer: undefined }, timeout: 90000 }, upstream => {
    const headers = { ...upstream.headers };
    delete headers['access-control-allow-origin'];
    res.writeHead(upstream.statusCode || 502, headers);
    upstream.pipe(res);
  });
  outbound.on('timeout', () => outbound.destroy(new Error('Server timed out')));
  outbound.on('error', () => { if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' }); res.end(JSON.stringify({ detail: 'Cannot reach the configured chess server. Offline modes are still available.' })); });
  req.pipe(outbound);
}
function serve(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    const api = currentApi();
    if (api) return proxyApi(req, res, api);
    res.writeHead(503, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ detail: 'No server connected. Use Desktop > Connect to Django server; offline chess is available.' }));
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
  if (pathname.includes('\0') || pathname.split('/').includes('..')) { res.writeHead(400); return res.end(); }
  const relative = pathname.replace(/^\/+/, '');
  let filename = path.resolve(DIST, relative || 'index.html');
  if (!(filename === DIST || filename.startsWith(DIST + path.sep))) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) filename = path.join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[path.extname(filename)] || 'application/octet-stream', 'x-content-type-options':'nosniff' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(filename).pipe(res);
}
function openSettings() {
  if (settingsWindow) { settingsWindow.focus(); return; }
  settingsWindow = new BrowserWindow({ width: 555, height: 400, modal: true, parent: mainWindow, resizable: false, autoHideMenuBar: true, title: 'Knight Chess — Server connection', webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, 'preload.cjs') } });
  settingsWindow.on('closed', () => { settingsWindow = null; });
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
  settingsWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}
function makeMenu() {
  const template = [
    { label: 'Desktop', submenu: [
      { label: 'Connect to Django server…', click: openSettings },
      { label: 'Refresh game', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
    ] },
    { label: 'View', submenu: [
      { label: 'Full Screen', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
      { label: 'Zoom In', role: 'zoomIn' }, { label: 'Zoom Out', role: 'zoomOut' }, { label: 'Reset Zoom', role: 'resetZoom' },
    ] },
    { label: 'Help', submenu: [{ label: 'Project & online setup instructions', click: () => shell.openExternal('https://github.com/adithyanhp/knight-chess') }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
function createWindow(port) {
  mainWindow = new BrowserWindow({ width: 1450, height: 920, minWidth: 980, minHeight: 650, backgroundColor: '#262421', title: 'Knight Chess', autoHideMenuBar: false, icon: path.join(__dirname, 'assets', 'knight.png'), webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
  mainWindow.loadURL(`http://${PORT_HOST}:${port}/`);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith('https://')) shell.openExternal(url); return { action: 'deny' }; });
  mainWindow.on('closed', () => { mainWindow = null; });
  makeMenu();
}
app.whenReady().then(() => {
  ipcMain.handle('knight:get-server', () => currentApi());
  ipcMain.handle('knight:set-server', (_event, raw) => {
    const api = normalizeApi(raw);
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.writeFileSync(settingsFile(), JSON.stringify({ apiUrl: api }, null, 2), { mode: 0o600 });
    mainWindow?.webContents.reloadIgnoringCache();
    return api;
  });
  ipcMain.handle('knight:close-settings', () => settingsWindow?.close());
  if (!fs.existsSync(path.join(DIST, 'index.html'))) return dialog.showErrorBox('Missing game files', 'The frontend was not built. Run npm run build before packaging.');
  server = http.createServer(serve);
  server.listen(0, PORT_HOST, () => createWindow(server.address().port));
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length && server?.listening) createWindow(server.address().port); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => server?.close());
