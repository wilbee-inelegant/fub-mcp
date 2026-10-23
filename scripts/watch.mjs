import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { root } from './generation.mjs';
let running = false, pending = false, timer;
function build() {
  if (running) { pending = true; return; }
  running = true;
  const child = spawn(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'inherit' });
  child.on('exit', () => { running = false; if (pending) { pending = false; build(); } });
  child.on('error', error => { console.error(error.message); running = false; });
}
function changed(directory, filename) {
  const relative = String(filename ?? '').replaceAll('\\', '/');
  if (directory === 'src' && (relative === 'generated' || relative.startsWith('generated/'))) return;
  clearTimeout(timer); timer = setTimeout(build, 150);
}
for (const directory of ['src', 'scripts']) fs.watch(path.join(root, directory), { recursive: true }, (_, filename) => changed(directory, filename));
for (const file of ['tsconfig.json', 'tsconfig.generator.json']) fs.watch(path.join(root, file), () => changed('', file));
build();
