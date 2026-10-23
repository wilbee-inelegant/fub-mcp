# Build-time API definitions and package boundaries

Run `npm ci --ignore-scripts`, then `npm run build`. The build runs locally from
tracked inputs; it does not fetch FUB documentation or call the CRM. No credentials
are needed. `npm run dev` watches source/build inputs and rebuilds sequentially.

1. Compile the build-only `scripts/generate-tools.ts` into `.build/generator/`.
2. Read `src/openapi/fub-openapi.json` and generate 156 `ToolDef` records into the
   ignored `src/generated/tool-defs.json` file.
3. Compile runtime TypeScript into a clean `dist/`. The runtime imports only the
   generated table, then applies current access settings, confirmations and overrides.
   One hand-written notes tool gives 157 total tools with all permissions enabled.
4. Record input hashes and verify deterministic generation plus emitted-table parity.
   `npm run check:generated` detects stale inputs or altered generated output.

Neither generated output nor temporary compiler output is committed. Always use
`npm run build`; calling the runtime TypeScript compiler alone does not perform
step 1/2. Build inputs and both source specs remain in GitHub. Nothing downloads a
spec at installation or server startup.

## What ships

Both npm and MCPB contain `dist/generated/tool-defs.json` with names, methods,
endpoint paths, parameter placement/defaults, input schemas and descriptions. This
is the data needed by discovery, validation and request construction. Original
operation/parameter descriptions and input-schema annotations are intentionally
preserved for compatibility; this is not a claim of independently authored prose.
Global OpenAPI metadata and response examples/schemas are not needed or included.

Both formats exclude `fub-openapi.json`, `openapi-gpt-actions.json`, `gpt/`,
`src/`, `scripts/`, `.build/`, and the old `dist/openapi/` runtime generator. GPT
Actions resources remain separately available in the repository. Excluding source
files changes packaging, not the interpretation of rights in derived material.

## Verification

- `npm test` compares full endpoint/parameter/default/description definitions and
  public MCP schemas against a frozen pre-refactor archive for all 16 access-flag
  combinations. Its fixture identifies that archive and its SHA-256. Existing
  mocked validation, permission, transport and stdio tests also run.
- `npm run check:generated` verifies input freshness, deterministic regeneration
  and the emitted runtime table. Ordinary runtime operations do not need the source.
- `npm run check:package` inspects npm's actual file list. MCPB staging and ZIP
  validation enforce the same full-spec and generator exclusions.
- `npm run check:licenses` verifies retained production dependency license files.

Before release, inspect both final archives and run stdio smoke tests against an
isolated installation/extraction with mocked fetch and synthetic credentials. Test
from the packages without repository source/build inputs. Do not remove the runtime
table itself: it replaces the full spec as the server's required endpoint/schema data.
