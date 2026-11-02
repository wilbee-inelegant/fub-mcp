import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { buildToolDefs, toMcpSchema } from '../dist/tools.js';
import { checkGenerated } from '../scripts/generation.mjs';
const baseline = JSON.parse(fs.readFileSync(new URL('./fixtures/runtime-baseline.json', import.meta.url), 'utf8'));
const { updates: descriptionUpdates } = JSON.parse(fs.readFileSync(new URL('./fixtures/capability-description-updates.json', import.meta.url), 'utf8'));
// Assert the reviewed wording exactly, then restore only those appendices for
// comparison with the immutable historical endpoint/schema/permission baseline.
function historicalDescriptions(tools) {
  return tools.map(tool => {
    const update = descriptionUpdates[tool.name];
    if (!update) return tool;
    assert.ok(update.after, `missing reviewed description for ${tool.name}`);
    assert.equal(tool.description.split(update.after).length, 2, `reviewed description must appear once: ${tool.name}`);
    return {...tool, description: tool.description.replace(update.after, update.before)};
  });
}
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const hash = value => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const config = mask => ({ apiKey: 'synthetic-parity', allowWrite: !!(mask & 1), allowDelete: !!(mask & 2), allowWebhooks: !!(mask & 4), allowAutomations: !!(mask & 8) });
test('all tool definitions and public schemas match the pre-refactor runtime apart from reviewed descriptions', () => {
  for (const expected of baseline.modes) {
    const tools = buildToolDefs(config(expected.mask));
    assert.equal(tools.length, expected.count, `tool count, mode ${expected.mask}`);
    assert.equal(hash(historicalDescriptions(tools)), expected.definitionHash, `endpoint/parameter/default/description parity, mode ${expected.mask}`);
    assert.equal(hash(historicalDescriptions(tools.map(toMcpSchema))), expected.schemaHash, `MCP schema parity, mode ${expected.mask}`);
  }
});
test('runtime overrides cannot mutate the generated table or accumulate descriptions', () => {
  const first = buildToolDefs(config(15));
  first[0].description = 'synthetic mutation';
  const expected = baseline.modes.find(mode => mode.mask === 15);
  assert.equal(hash(historicalDescriptions(buildToolDefs(config(15)))), expected.definitionHash);
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
