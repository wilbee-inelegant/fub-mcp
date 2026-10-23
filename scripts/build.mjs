import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, inputHashes, renderDefinitions, checkGenerated } from './generation.mjs';
function compile(project) {
  const result = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', project], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
// These are managed build outputs, never source or installed-host configuration.
fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
fs.rmSync(path.join(root, '.build/generator'), { recursive: true, force: true });
compile('tsconfig.generator.json');
const definitions = await renderDefinitions();
fs.mkdirSync(path.join(root, 'src/generated'), { recursive: true });
fs.writeFileSync(path.join(root, 'src/generated/tool-defs.json'), definitions);
compile('tsconfig.json');
fs.writeFileSync(path.join(root, '.build/generator-inputs.json'), JSON.stringify(inputHashes()));
await checkGenerated();
console.log(`Built runtime with ${JSON.parse(definitions).length} generated API tool definitions; source specs are build inputs only.`);
