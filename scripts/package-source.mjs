import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Manual export only. Source archives are never put in the public website.
const root = process.cwd();
const roots = ["frontend", "backend", "scripts", "public"];
const packageInfo = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const filenames = [
  "package.json",
  "package-lock.json",
  "vite.config.js",
  "offline-plugin.js",
  "index.html",
  "docker-compose.yml",
  "Dockerfile.frontend",
  "nginx.conf",
  ".env.example",
  ".gitignore",
  ".gitattributes",
  ".dockerignore",
  "README.md",
  "Deployment_Guide.md",
  "Deployment_Checklist.md",
  "Local_Setup_Guide.md",
  "VERIFICATION.md",
  "THIRD_PARTY_NOTICES.md",
  "LICENSE",
  "COPYING",
  "vercel.json",
  "render.yaml",
];
const blocked = new Set([
  "node_modules",
  ".git",
  ".venv",
  "venv",
  "env",
  "__pycache__",
  "media",
  "staticfiles",
  ".pytest_cache",
  "downloads",
  "dist",
  "release",
  ".openai",
  ".sites-runtime",
  ".vercel",
]);
function walk(relative) {
  const dir = path.join(root, relative);
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      blocked.has(entry.name) ||
      entry.name.startsWith(".env") ||
      entry.name.endsWith(".sqlite3") ||
      entry.name.endsWith(".pyc") ||
      entry.name.endsWith(".zip") ||
      entry.isSymbolicLink()
    )
      continue;
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) walk(name);
    else if (entry.isFile()) filenames.push(name);
  }
}
roots.forEach(walk);
const files = [...new Set(filenames)]
  .filter((name) => fs.existsSync(path.join(root, name)))
  .sort()
  .map((name) => ({
    name: "knight-chess/" + name,
    data: fs.readFileSync(path.join(root, name)),
  }));
const digest = crypto.createHash("sha256");
for (const file of files) digest.update(file.name).update(file.data);
files.push({
  name: "knight-chess/SOURCE_VERSION.json",
  data: Buffer.from(
    JSON.stringify(
      {
        app: "Knight",
        version: packageInfo.version,
        builtAt: new Date().toISOString(),
        sourceSha256: digest.digest("hex"),
        files: files.map(file => ({
          path: file.name,
          sha256: crypto.createHash("sha256").update(file.data).digest("hex"),
          bytes: file.data.length,
        })),
      },
      null,
      2,
    ) + "\n",
  ),
});
const table = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(data) {
  let c = 0xffffffff;
  for (const b of data) c = table[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
const locals = [],
  central = [];
const archiveTime = new Date();
const dosTime =
  (archiveTime.getUTCHours() << 11) |
  (archiveTime.getUTCMinutes() << 5) |
  Math.floor(archiveTime.getUTCSeconds() / 2);
const dosDate =
  ((archiveTime.getUTCFullYear() - 1980) << 9) |
  ((archiveTime.getUTCMonth() + 1) << 5) |
  archiveTime.getUTCDate();
let offset = 0;
for (const file of files) {
  const name = Buffer.from(file.name);
  const checksum = crc32(file.data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x800, 6);
  local.writeUInt16LE(dosTime, 10);
  local.writeUInt16LE(dosDate, 12);
  local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(file.data.length, 18);
  local.writeUInt32LE(file.data.length, 22);
  local.writeUInt16LE(name.length, 26);
  locals.push(local, name, file.data);
  const cd = Buffer.alloc(46);
  cd.writeUInt32LE(0x02014b50);
  cd.writeUInt16LE(20, 4);
  cd.writeUInt16LE(20, 6);
  cd.writeUInt16LE(0x800, 8);
  cd.writeUInt16LE(dosTime, 12);
  cd.writeUInt16LE(dosDate, 14);
  cd.writeUInt32LE(checksum, 16);
  cd.writeUInt32LE(file.data.length, 20);
  cd.writeUInt32LE(file.data.length, 24);
  cd.writeUInt16LE(name.length, 28);
  cd.writeUInt32LE(offset, 42);
  central.push(cd, name);
  offset += local.length + name.length + file.data.length;
}
const centralBuffer = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralBuffer.length, 12);
end.writeUInt32LE(offset, 16);
fs.mkdirSync(path.join(root, "release"), { recursive: true });
fs.writeFileSync(
  path.join(root, "release/knight-chess-hosting-ready.zip"),
  Buffer.concat([...locals, centralBuffer, end]),
);
process.stdout.write(
  `Packaged ${files.length} source files in release/knight-chess-hosting-ready.zip\n`,
);
