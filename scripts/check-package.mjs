import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, checkGenerated } from './generation.mjs';
const excludedName = /^(fub-openapi\.json|openapi-gpt-actions\.json|generate-tools\.(js|ts))$/;
export function assertRuntimeFiles(files) {
  for (const file of files) {
    const parts = file.replaceAll('\\', '/').split('/');
    assert.ok(!parts.some(part => excludedName.test(part)), `Excluded build input in package: ${file}`);
    assert.ok(!['src', 'scripts', '.build', 'gpt'].includes(parts[0]), `Source-only directory in package: ${file}`);
    assert.ok(!file.startsWith('dist/openapi/'), `Stale spec/generator output: ${file}`);
  }
  assert.ok(files.includes('dist/generated/tool-defs.json'), 'Missing generated runtime table');
  assert.ok(files.includes('dist/index.js'), 'Missing server entrypoint');
}
function filesIn(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix + entry.name;
    // Dependency licenses are checked separately; never traverse external symlinks.
    if (entry.isSymbolicLink()) return [];
    return entry.isDirectory() ? filesIn(path.join(directory, entry.name), relative + '/') : [relative];
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.join(root, 'scripts/check-package.mjs')) {
  if (process.argv[2] === '--stage') {
    assertRuntimeFiles(filesIn(path.resolve(process.argv[3])));
  } else {
    await checkGenerated();
    // npm_execpath avoids Windows .cmd spawning and uses the invoking npm CLI.
    assert.ok(process.env.npm_execpath, 'Run with npm run check:package');
    const result = spawnSync(process.execPath, [process.env.npm_execpath, 'pack', '--dry-run', '--ignore-scripts', '--json'], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    if (result.status !== 0) throw new Error('npm pack inspection failed: ' + result.stderr);
    const files = JSON.parse(result.stdout)[0].files.map(file => file.path);
    assertRuntimeFiles(files);
  }
  console.log('Package contains generated runtime definitions; full specs, GPT assets and generator are excluded.');
}
