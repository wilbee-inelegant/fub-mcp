import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { buildToolDefs, executeTool, toMcpSchema } from '../dist/tools.js';
import { FubApiError } from '../dist/http.js';

const normal = { apiKey: 'synthetic-key', systemName: 'offline-capability-tests', allowWrite: true, allowDelete: false, allowWebhooks: false, allowAutomations: false };
const by = Object.fromEntries(buildToolDefs(normal).map(t => [t.name, t]));
const readOnly = { ...normal, allowWrite: false };
const readBy = Object.fromEntries(buildToolDefs(readOnly).map(t => [t.name, t]));

test('automation reads remain exposed with all mutation gates off', () => {
  for (const name of ['list_automations', 'get_automation']) {
    assert.equal(readBy[name].method, 'GET');
    assert.match(readBy[name].description, /registered systems/);
    assert.match(readBy[name].description, /do not require FUB_MCP_ALLOW_AUTOMATIONS/);
  }
  assert.equal(readBy.create_automations_person, undefined);
  assert.equal(by.create_automations_person, undefined);
});

test('automation GET 403 reaches HTTP and returns only the sanitized upstream error', async () => {
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++;
    assert.equal(init.method, 'GET');
    return new Response('synthetic-private-upstream-body', { status: 403 });
  };
  try {
    await assert.rejects(executeTool(readOnly, readBy.list_automations, {limit: 1}), error => {
      assert.ok(error instanceof FubApiError);
      assert.equal(error.status, 403);
      assert.match(error.message, /FUB API returned HTTP 403/);
      assert.doesNotMatch(error.message, /synthetic-private|synthetic-key|FUB_MCP_ALLOW/);
      return true;
    });
    assert.equal(calls, 1);
  } finally { globalThis.fetch = previous; }
});

test('stage schema does not promise description writes; unknown extras fail before HTTP', async () => {
  const t = by.update_stage;
  assert.equal(toMcpSchema(t).inputSchema.properties.description, undefined);
  assert.match(t.description, /does not expose a stage description field/);
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('Unexpected HTTP request'); };
  try {
    await assert.rejects(executeTool(normal, t, {id: 1, description: 'test', confirm: true}));
    await assert.rejects(executeTool(normal, t, {id: 1, extraBody: {description: 'test'}, confirm: true}));
    assert.equal(calls, 0);
  } finally { globalThis.fetch = previous; }
});

test('successful stage reads preserve optional fields without promising their availability', async () => {
  const previous = globalThis.fetch;
  const stage = {id: 1, name: 'Lead', description: 'synthetic-observed-description'};
  globalThis.fetch = async () => new Response(JSON.stringify(stage));
  try {
    assert.deepEqual(await executeTool(readOnly, readBy.get_stage, {id: 1}), stage);
    assert.match(readBy.get_stage.description, /not documented or guaranteed/);
    assert.match(readBy.list_stages.description, /missing description is unknown/);
    delete stage.description;
    const result = await executeTool(readOnly, readBy.get_stage, {id: 1});
    assert.equal(Object.hasOwn(result, 'description'), false);
  } finally { globalThis.fetch = previous; }
});

test('inventory descriptions warn against inferring definitions', () => {
  assert.match(by.list_smart_lists.description, /all=true/);
  assert.match(by.list_smart_lists.description, /not filter definitions/);
  assert.match(by.get_smart_list.description, /not filter definitions/);
  assert.match(by.list_action_plans.description, /not action steps or trigger definitions/);
  assert.match(by.list_action_plans.description, /planned deprecation/);
  assert.equal(by.get_action_plan, undefined);
});

test('stdio initialization and discovery expose capability limits without CRM calls', async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['--import', new URL('./mock-preload.mjs', import.meta.url).href, fileURLToPath(new URL('../dist/index.js', import.meta.url))],
    env: {FUB_API_KEY: 'synthetic-test-key', FUB_MCP_SYSTEM_KEY: '', FUB_MCP_ALLOW_WRITE: '0', FUB_MCP_ALLOW_DELETE: '0', FUB_MCP_ALLOW_WEBHOOKS: '0', FUB_MCP_ALLOW_AUTOMATIONS: '0'},
    stderr: 'pipe',
  });
  const client = new Client({name: 'capability-discovery-test', version: '1.0.0'});
  try {
    await client.connect(transport);
    const instructions = client.getInstructions();
    assert.match(instructions, /CAPABILITY CHECK/);
    assert.match(instructions, /Never mark a dependency audit complete from names alone/);
    assert.match(instructions, /sanitized tool error/);
    assert.match(instructions, /HTTP 403 is an upstream refusal/);
    const {tools} = await client.listTools();
    assert.equal(tools.length, 70);
    assert.match(tools.find(t => t.name === 'list_smart_lists').description, /not filter definitions/);
    assert.match(tools.find(t => t.name === 'list_automations').description, /registered systems/);
  } finally { await client.close(); }
});
