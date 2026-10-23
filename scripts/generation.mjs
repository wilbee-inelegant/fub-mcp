import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
export const root = fileURLToPath(new URL('../', import.meta.url));
export const inputs = ['scripts/generate-tools.ts', 'src/types.ts', 'src/openapi/fub-openapi.json', 'tsconfig.generator.json', 'tsconfig.json'];
export function inputHashes() {
  return Object.fromEntries(inputs.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(new URL('../' + file, import.meta.url))).digest('hex')]));
}
export async function renderDefinitions() {
  const { generateTools } = await import('../.build/generator/scripts/generate-tools.js');
  const spec = JSON.parse(fs.readFileSync(new URL('../src/openapi/fub-openapi.json', import.meta.url), 'utf8'));
  return JSON.stringify(generateTools(spec)) + '\n';
}
export async function checkGenerated() {
  const saved = JSON.parse(fs.readFileSync(new URL('../.build/generator-inputs.json', import.meta.url), 'utf8'));
  assert.deepEqual(saved, inputHashes(), 'Generation inputs changed: run npm run build.');
  const expected = await renderDefinitions();
  assert.equal(await renderDefinitions(), expected, 'Generation must be deterministic.');
  for (const file of ['src/generated/tool-defs.json', 'dist/generated/tool-defs.json']) {
    // TypeScript reformats JSON during emit; compare parsed content for dist.
    const actual = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    if (file.startsWith('src/')) assert.equal(actual, expected, 'Generated source drifted.');
    else assert.deepEqual(JSON.parse(actual), JSON.parse(expected), 'Emitted runtime definitions drifted.');
  }
}
