import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { buildToolDefs, toMcpSchema } from '../dist/tools.js';
import { checkGenerated } from '../scripts/generation.mjs';
const baseline = JSON.parse(fs.readFileSync(new URL('./fixtures/runtime-baseline.json', import.meta.url), 'utf8'));
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const hash = value => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const config = mask => ({ apiKey: 'synthetic-parity', allowWrite: !!(mask & 1), allowDelete: !!(mask & 2), allowWebhooks: !!(mask & 4), allowAutomations: !!(mask & 8) });
test('all tool definitions and public schemas match the pre-refactor runtime in every access mode', () => {
  for (const expected of baseline.modes) {
    const tools = buildToolDefs(config(expected.mask));
    assert.equal(tools.length, expected.count, `tool count, mode ${expected.mask}`);
    assert.equal(hash(tools), expected.definitionHash, `endpoint/parameter/default/description parity, mode ${expected.mask}`);
    assert.equal(hash(tools.map(toMcpSchema)), expected.schemaHash, `MCP schema parity, mode ${expected.mask}`);
  }
});
test('runtime overrides cannot mutate the generated table or accumulate descriptions', () => {
  const first = buildToolDefs(config(15));
  first[0].description = 'synthetic mutation';
  const expected = baseline.modes.find(mode => mode.mask === 15);
  assert.equal(hash(buildToolDefs(config(15))), expected.definitionHash);
});
test('generation is reproducible and emitted runtime has no full spec or generator', async () => {
  await checkGenerated();
  assert.equal(fs.existsSync(new URL('../dist/openapi/', import.meta.url)), false);
  const table = JSON.parse(fs.readFileSync(new URL('../dist/generated/tool-defs.json', import.meta.url), 'utf8'));
  assert.ok(Array.isArray(table));
  for (const tool of table) {
    assert.deepEqual(Object.keys(tool).sort(), ['description','hasExtraBody','hasExtraQuery','isDelete','method','name','params','pathTemplate'].sort());
    assert.ok(!('responses' in tool) && !('openapi' in tool) && !('paths' in tool));
  }
});

import { assertRuntimeFiles } from '../scripts/check-package.mjs';
test('packaging guard rejects stale specs and source-only assets', () => {
  const runtime = ['dist/index.js', 'dist/generated/tool-defs.json'];
  assert.doesNotThrow(() => assertRuntimeFiles(runtime));
  for (const file of ['dist/openapi/fub-openapi.json', 'gpt/openapi-gpt-actions.json', 'scripts/generate-tools.ts', 'dist/openapi/generate-tools.js']) {
    assert.throws(() => assertRuntimeFiles([...runtime, file]));
  }
});
