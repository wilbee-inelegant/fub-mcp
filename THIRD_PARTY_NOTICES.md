# Third-party material and redistribution status

Reviewed 2026-10-27 against the actual 0.3.0 npm tarball and unsigned MCPB archive.
This records evidence and outstanding permission questions, not legal certification.
The project's [MIT license](LICENSE) covers its original code; it does not relicense
third-party material.

## JavaScript dependencies: notices present

The MCPB contains 94 locked production package installations (including nested
versions): 84 MIT, 7 ISC, 2 BSD-3-Clause and 1 BSD-2-Clause. Every installation has a
nonempty upstream license file. These preserve copyright, conditions and disclaimers;
the BSD licenses also include their applicable distribution/non-endorsement terms.
No missing dependency notice was found. The package license files supplied in the
installed npm distributions are the primary sources for this inventory.

[third-party-licenses.json](third-party-licenses.json) lists each installed path,
name, version, declared license, license filename and SHA-256 of its exact bytes.
In the MCPB, open the corresponding `node_modules/.../LICENSE*` file for its full
text. Full dependency trees are retained, including their source notices. The
review found no separate NOTICE/COPYING files that needed adding.

Examples include `@modelcontextprotocol/sdk` 1.32.1 (MIT), `ajv` 8.20.0 (MIT),
`fast-uri` 3.1.9 and `qs` 6.16.1 (BSD-3-Clause), and `json-schema-typed` 8.0.2
(BSD-2-Clause, including its JSON Schema attribution).

The npm tarball contains this project's compiled JavaScript and schemas, not a
bundled copy of node_modules. npm installs dependencies separately with their own
license files. This inventory describes the locked desktop distribution; it is not
a promise that future npm consumer installs resolve identical transitive versions.
Development-only TypeScript and Node types are not shipped in either archive.

Run `npm run check:licenses` after `npm ci --ignore-scripts`. The MCPB build also
checks the staged production tree against the inventory before packing. For an
intentional dependency update, review the new upstream files, then regenerate with
`node scripts/check-licenses.mjs --write` and commit the reviewed inventory. A new
license family requires explicit review and an update to the checker.

## FUB API source and generated runtime definitions

Source provenance: FUB's [OpenAPI download page](https://docs.followupboss.com/openapi)
and [published JSON](https://docs.followupboss.com/openapi/58b53c341065f9c438aa1f7e).
The repository retains `src/openapi/fub-openapi.json` as a build input and
`gpt/openapi-gpt-actions.json` as a separate modified GPT Actions resource.

The npm and desktop archives exclude both full JSON files, all GPT assets, the
source generator and temporary build files. They include only
`dist/generated/tool-defs.json`: generated tool names, HTTP methods, endpoint paths,
parameter locations/defaults, input validation schemas and useful tool/parameter
descriptions. These descriptions and schema annotations remain derived from the
source documentation. Global OpenAPI metadata and response schemas/examples are
not copied into the runtime table. This is not a renamed or embedded full spec.

The root project license does not purport to relicense upstream material. Missing
license metadata alone does not establish a release prohibition or a permission
requirement. The earlier checklist's blanket permission gate overstated what the
packaging review could establish; it is removed. Neither generation nor excluding
full source files is legal clearance. Repository source copies remain a separate
distribution decision. This review records provenance and actual contents without
making a legal determination.

API use and registration remain subject to the official
[API terms](https://docs.followupboss.com/reference/fub-api-tou) and
[registration guidance](https://docs.followupboss.com/reference/identification).
No vendor approval or endorsement is claimed.
