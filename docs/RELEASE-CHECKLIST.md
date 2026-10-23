# 0.3.0 release checklist

Canonical repository: `wilbee-inelegant/fub-mcp`, private during staging.
The security baseline is merged at `f80356a305206593f69a82e561282731b8d0824c`.
The release candidate also includes [company PR #2](https://github.com/wilbee-inelegant/fub-mcp/pull/2).
The commands below resolve that PR's immutable merge commit and check out that exact
SHA. They fail the length check while it is unmerged; never substitute a moving branch.

## Complete before public release

- [ ] Resolve the specific FUB schema redistribution question in
  [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md). Dependency license files are
  present; no generic dependency-license review remains open for the locked tree.
- [ ] Complete the [fresh desktop GUI checklist](DESKTOP-QA.md) on isolated Mac and
  Windows profiles before claiming desktop compatibility or releasing its bundle.
- [ ] Owner chooses public repository visibility and verifies source/download and
  private security-reporting access. Staging/merge does not make the repository public.
- [ ] Confirm npm ownership/authentication privately and announce the default-mode
  change: viewing only; updates enabled by one toggle or `FUB_MCP_ALLOW_WRITE=1`.

## Build the pinned merge, one command at a time

Use a new folder, supported Node (22.16+, 24 or 26), and no CRM keys. Stop on failure.
`MERGED_COMMIT_SHA` is resolved from the specific merged PR, not from `main`.
Compare the printed SHA with the final maintainer handoff.

```sh
gh repo clone wilbee-inelegant/fub-mcp fub-mcp-release-0.3.0
cd fub-mcp-release-0.3.0
MERGED_COMMIT_SHA="$(gh pr view 2 --repo wilbee-inelegant/fub-mcp --json mergeCommit --jq '.mergeCommit.oid')"
test "${#MERGED_COMMIT_SHA}" -eq 40
printf '%s\n' "$MERGED_COMMIT_SHA"
git checkout --detach "$MERGED_COMMIT_SHA"
git status --short
npm ci --ignore-scripts
npm test
npm run check:release
npm run check:licenses
npm audit
npm pack --dry-run --ignore-scripts
npm pack --ignore-scripts
tar -tzf fub-mcp-0.3.0.tgz
shasum -a 256 fub-mcp-0.3.0.tgz
npm whoami
npm view fub-mcp@0.3.0 version
```

Inspect archive paths and notices. E404 from the final version lookup means that
version is not published; any existing version means stop and select a new version.
Record commit, runtime versions and archive checksum. Do not rebuild after review.

Only the owner publishes the inspected tarball after the gates above:

```sh
npm publish ./fub-mcp-0.3.0.tgz --access public
npm view fub-mcp@0.3.0 version dist.integrity dist.tarball
```

For the desktop release, run `npm run build:mcpb`, verify its checksum and complete
GUI QA; then publish the unsigned bundle and checksum from the reviewed commit.
[Detailed release procedure](RELEASE.md) includes checks after publication. Neither
this checklist nor CI publishes npm, changes visibility or updates a live instance.
