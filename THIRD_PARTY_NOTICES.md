# Third-party material and redistribution status

Reviewed 2026-10-23 against the actual 0.3.0 npm tarball and unsigned MCPB archive.
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
`fast-uri` 3.1.8 and `qs` 6.16.0 (BSD-3-Clause), and `json-schema-typed` 8.0.2
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

## FUB OpenAPI descriptions: unresolved release blocker

These files contain upstream API descriptions:

- `src/openapi/fub-openapi.json` (copied into `dist/openapi/fub-openapi.json`).
- `gpt/openapi-gpt-actions.json` (a modified subset).

Both JSON `info` objects lack a license declaration. Repository history identifies
the source as FUB's published API description, but records no explicit redistribution
grant or written permission. Public documentation access is not evidence of such a
grant. Both archives currently include these descriptions.

The official [API Terms of Use](https://docs.followupboss.com/reference/fub-api-tou)
sections 2(q) and 9 address copying and ownership. The [Terms of Service](https://www.followupboss.com/legal-pages/terms-of-service)
sections 3.2 and 5.1 address copying and documentation rights. We did not establish
an express license covering redistribution of the vendored JSON and modified subset.

Before public source/package/bundle release, the maintainer must obtain written FUB
permission covering both files and modifications, or document another sufficient
rights basis after qualified review. Ask what attribution/license text is required,
and retain that evidence. A notice added by this project cannot grant those rights.
Do not simply label the upstream files MIT, strip their attribution, or silently
remove the runtime schema: tool generation depends on it. Contact details are on
FUB's [getting-started page](https://docs.followupboss.com/reference/getting-started).
No permission request has been sent by this review.

## API use and registration are separate

Follow the official [registration guidance](https://docs.followupboss.com/reference/identification)
and API terms for the intended deployment, including system registration and keeping
system credentials private. API access approval does not by itself settle schema
redistribution rights. Confirm the intended assistant/provider data handling and
any hosted/service offering with FUB when resolving the permission question.
