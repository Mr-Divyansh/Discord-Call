import fs from 'fs';
import path from 'path';

const root = process.cwd();
const src = path.join(root, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm');
const out = path.join(root, 'public', 'ffmpeg-core');

if (!fs.existsSync(src)) {
  console.warn('[callframe] @ffmpeg/core dist not found — ffmpeg.wasm core will load from CDN at render time');
  process.exit(0);
}

fs.mkdirSync(out, { recursive: true });
let count = 0;
for (const f of fs.readdirSync(src)) {
  fs.copyFileSync(path.join(src, f), path.join(out, f));
  count++;
}
console.log(`[callframe] copied ${count} ffmpeg.wasm core file(s) to public/ffmpeg-core`);
