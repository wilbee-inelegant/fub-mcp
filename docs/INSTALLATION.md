# Installation: local and always-on clients

These instructions describe version 0.3.0. Platform documentation was checked on
2026-10-23. The Grok Command-mode procedure below additionally records an
owner-reported, one-account test on 2026-11-02; it is not platform certification.

## Understand the connection

| Model | Where the process and key live | Current status |
|---|---|---|
| Desktop/CLI stdio | On the machine running the MCP client | Implemented; client starts the child process |
| Always-on stdio | On a private VM running both the agent and this process | Same transport; requires an agent that supports spawning stdio children |
| Remote HTTPS MCP | On a server, with client-facing authentication | Not implemented; no HTTP listener, OAuth server, or remote bearer-token verifier |
| Custom GPT Actions | Key stored in the GPT configuration; OpenAI calls FUB directly | Separate repository-only integration under `gpt/`; excluded from MCP packages |

A background `node dist/index.js` process on its own is not a remote endpoint.
Neither a reverse proxy nor a firewall converts stdio into HTTP. Do not expose an
anonymous bridge carrying an owner's CRM key.

## Source installation for a stdio host

Use Git and a supported Node.js LTS runtime; Node 24 is the baseline for new installs.
The CI workflow tests Node 22.16.0, 24 and 26 on Linux and Windows. Check the
actual results for the commit you install; configured jobs alone are not evidence
of a passing matrix. Local review testing used macOS arm64 and Node 26.7.0.
Supported runtime lines are Node 22.16+, 24 and 26.

1. Clone the repository and choose a maintainer-reviewed immutable release tag or
   commit. Replace REVIEWED_REF below with the immutable commit/tag of the release you
   reviewed. Do not install an unmerged candidate as a stable release:

   ```sh
   git clone https://github.com/wilbee-inelegant/fub-mcp.git
   cd fub-mcp
   git checkout --detach REVIEWED_REF
   npm ci --ignore-scripts
   npm run build
   ```

2. Configure your host to launch the built entry point. For hosts using an
   `mcpServers` JSON structure, adapt the paths:

   ```json
   {
     "mcpServers": {
       "fub-mcp": {
         "command": "/absolute/path/to/node",
         "args": ["/absolute/path/to/fub-mcp/dist/index.js"],
         "env": {"FUB_MCP_ALLOW_WRITE": "0"}
       }
     }
   }
   ```

   Windows paths must be JSON escaped (for example `C:\\...\\node.exe`). Other
   clients use different schemas; do not paste this into an undocumented settings UI.

3. Supply `FUB_API_KEY` using the host's protected secret settings/environment
   injection. Check that the child receives the variable without displaying its
   value. Do not insert keys into a CLI argument, repository, prompt, or screenshot.
   GUI apps may not inherit terminal environment variables. If your host stores
   secrets in its JSON configuration, treat that file as plaintext credentials,
   restrict its permissions/ACL, and exclude it from sync and backups as appropriate.

4. Start/restart the host and verify tools are listed. Version 0.3.0 lists 70 GET
   tools by default. Start with a small read explicitly
   authorized by the account owner. `npm test` runs offline mocks; the legacy
   `smoke-test.mjs` refuses to perform live requests.

5. Review host logs for failures without copying CRM data or credentials into issues.
   Missing key errors usually mean the child did not receive the environment.
   Missing command errors usually mean the host cannot resolve Node or the script.

Pin releases and review changes before updates. Avoid an unversioned `npx -y`
command that fetches new code while inheriting CRM secrets. For the desktop bundle,
use a specific release artifact and verify published hashes when available. The
maintainer should publish those hashes; this review did not verify downloaded assets.

## Grok Command mode: observed setup and recovery

### What was actually tested

An owner-reported test on 2026-11-02 used a private sandbox account with version
0.3.0 at commit `721485e03433a34d84d26d74c4068ce5eb1e332a`. Node **24.22.2** was
installed alongside the host's system Node 20, which is not supported by this
package. A dummy hidden-secret-card test confirmed environment inheritance and
matching without exposing the value. The actual MCP process was stopped and
relaunched; dummy checks and then authorized live FUB GET/identity checks passed
before and after a new process. Discovery listed **70 GET tools**, with write,
delete, webhook and automation gates off.

This is evidence for that account and environment only, not an official Grok
platform guarantee. Literal placeholder interpolation such as `${FUB_API_KEY}` in
connector JSON was not tested and is not needed for the working inheritance route.
No destructive host reset test is required or recommended to repeat these checks.

### Install with a separate, explicit Node runtime

1. Use Command/stdio mode, not an HTTPS URL. Install a supported Node runtime in a
   separate user-controlled location using reviewed official distribution steps
   and checksum/signature verification. Do not replace the host's system Node.
   Supported lines are 22.16+, 24 and 26; the observed runtime was 24.22.2.
2. Record the **absolute Node binary path**, matching npm executable path, and
   checkout path. The placeholders below must be replaced with actual paths; they
   are not secret-template expressions. In a build environment without CRM secrets:

   ```sh
   NODE_BIN_DIR=/absolute/path/to/node-24.22.2/bin
   export PATH="$NODE_BIN_DIR:$PATH"
   "$NODE_BIN_DIR/node" --version
   "$NODE_BIN_DIR/node" -p 'process.execPath'
   "$NODE_BIN_DIR/npm" --version
   git clone https://github.com/wilbee-inelegant/fub-mcp.git
   cd fub-mcp
   git checkout --detach 721485e03433a34d84d26d74c4068ce5eb1e332a
   git rev-parse HEAD
   "$NODE_BIN_DIR/npm" ci --ignore-scripts
   "$NODE_BIN_DIR/npm" run build
   "$NODE_BIN_DIR/npm" test
   "$NODE_BIN_DIR/npm" run check:generated
   ```

   Putting this directory first in PATH also makes npm's child build commands use
   that Node rather than system Node 20. `dist/index.js` must exist after the build.
   Keep this guide separately: the pinned older code commit predates this addendum.
3. Set the connector command to the **same absolute Node binary**, and its argument
   to the absolute `dist/index.js` path. Do not rely on bare `node`, a terminal's
   interactive version-manager setup, or an unversioned `npx` launch. Adapt the
   earlier JSON example to the host's actual schema; set all four nonsecret flags:

   ```json
   {
     "FUB_MCP_ALLOW_WRITE": "0",
     "FUB_MCP_ALLOW_DELETE": "0",
     "FUB_MCP_ALLOW_WEBHOOKS": "0",
     "FUB_MCP_ALLOW_AUTOMATIONS": "0"
   }
   ```

4. First use a synthetic value in the host's hidden secret card for `FUB_API_KEY`.
   Verify the newly launched child inherits it using a presence/match-only result,
   never an environment dump, value, hash, header or credential screenshot. Use
   offline mocks for dummy-key checks; do not send a dummy key to FUB. Do not set
   `FUB_API_KEY` to a literal placeholder in the connector's nonsecret JSON env block:
   it can override inherited input. Leave it out of that block for this route.
5. The owner enters the real key directly into the protected card, never into chat.
   Stop and relaunch the actual connector child as described below, then perform
   only an owner-authorized small GET/identity check. Confirm the intended account
   privately and report only pass/fail, not identity or CRM payloads. Keep the gates
   above off. Do not run `setup --local` or create a `.env` fallback for this route.

### Verify a real process restart

The tested UI restart control reportedly did **not** relaunch the MCP process.
A button click or new chat alone is not proof of a fresh environment.

- Record the connector child's PID and start time using host process information
  that does not display environments or command-line secrets.
- Use the host's supported stop/start control for this connector. If necessary,
  stop only the positively identified MCP child through an authorized process
  manager; never kill unrelated Node processes or reset the whole computer.
- Verify the old child exited and a new process/start time appeared using the exact
  intended Node and entry-point paths. PID alone may be reused.
- Recheck presence-only secret inheritance, the 70-GET-tool listing, all four gates
  off, and the authorized minimal identity/read check in the new process. Never
  test a forbidden write against live CRM just to prove the gate works.
- If the actual child cannot be identified or restarted safely, stop here and ask
  the host operator for help. Do not claim the secret change took effect.

### Secret storage and bot visibility

In this reported setup the key was absent from chat, connector JSON, the repository,
logs and `.env` fallback. It **does** live in the platform-managed, owner-only
secret store and in inherited process environment. "Hidden" does not mean absent
from the host or inaccessible to same-user processes, subprocesses, or an agent
with equivalent shell access. Do not dump or inspect those values to demonstrate
this boundary.

Other bots on the same account may be able to use the connector; do not assume a
private chat or an owner-only card makes connector use exclusive to one bot.
Review actual sharing and host isolation before enabling it. Acceptance of this
scope for one owner's account is not a recommendation for shared/team deployment.
The MCP read-only gate limits this server's tools, **not the underlying API key**:
an owner/admin key may still have broad FUB powers when used outside this server.
Choose a least-privileged FUB identity and limit which bots/processes can access it.

### Recover after a host update or reset

Runtime packages, dependencies, checkout files or build output may be replaced or
removed by host updates/resets. Secret-store survival across a host update or reset
was **not tested**; neither storage persistence nor automatic recovery is promised.
Do not reset a working host merely to test persistence.

1. Keep a **nonsecret** recovery record outside the disposable host: reviewed commit,
   runtime version, absolute paths, four disabled gates, and these instructions.
2. After a disruption, check the exact Node binary/version, checkout commit and
   built entry point. If anything is missing, restore a reviewed separate Node
   runtime and a fresh checkout at the pinned commit, then repeat the build and
   offline checks above without runtime secrets. Do not overwrite local changes
   or use destructive cleanup commands.
3. Recheck the connector's absolute paths and disabled gates. Have the owner verify
   that the protected secret entry exists, without revealing it. If absent, pause
   for the owner to enter it privately; never recover a key from chat, logs, source
   files or another bot. Do not rotate/change credentials as an automatic repair.
4. Verify a genuinely new MCP process, secret presence, tool listing and an
   authorized minimal identity/read check. If the runtime, secret store or process
   controls are unavailable, keep the connector disabled and report the specific
   missing component. A passing process restart is not a passing host-reset test.

## Access modes

| What you want | Claude Desktop setting | Environment settings |
|---|---|---|
| View information | Leave **View and update records** off | `FUB_MCP_ALLOW_WRITE=0` (default) |
| View and update records | Turn **View and update records** on | `FUB_MCP_ALLOW_WRITE=1` |
| Also allow permanent deletes | Enable updates and **Advanced: allow permanent deletes** | Above plus `FUB_MCP_ALLOW_DELETE=1` |
| Also manage webhooks | Enable updates and **Advanced: manage webhooks**, then enter approved hosts | Above plus `FUB_MCP_ALLOW_WEBHOOKS=1` and `FUB_MCP_WEBHOOK_HOSTS=hooks.example.com` |
| Also trigger workflows directly | Enable updates and **Advanced: trigger workflows directly** | Above plus `FUB_MCP_ALLOW_AUTOMATIONS=1` |

Restart the server/extension and open a new chat after changing settings. In JSON,
use string values such as `"FUB_MCP_ALLOW_WRITE": "1"`; extension boolean settings
also produce supported `true`/`false` strings. Invalid flags stop startup rather
than silently enabling access. Turning updates off blocks all non-GET calls even
if advanced switches remain on. No API-key change is needed to switch modes.

Ordinary update mode exposes 126 tools; all opt-ins expose 157. All non-GET calls
also require boolean `confirm: true`. This is a caller assertion, not proof of a
human decision. Use the host's independent approvals. The conservative viewing mode
blocks POST preview utilities too. The workflow switch covers direct `/events`,
`/actionPlansPeople` and `/automationsPeople` writes. Ordinary updates may activate
existing business rules in FUB; do not promise that they have no side effects.

Webhook hostnames must be exact (comma-separated if needed), without wildcards.
New/changed destinations must be HTTPS on port 443, with no embedded credentials,
IP address (including IPv6), trailing-dot hostname or fragment. Host restrictions
do not audit existing webhook URLs;
review existing subscriptions before granting webhook administration.

## Configuration and secret precedence

`FUB_API_KEY` in the process environment wins over the fallback file
`~/.fub-mcp/.env`. A project-root `.env` is **not** automatically loaded, so copying
`.env.example` to the checkout alone does not configure the server. Only the API key
is read from the fallback file. The system name, system key, access flags and webhook host list must be
process environment variables. `FUB_MCP_SYSTEM_KEY` is ignored unless a nonblank
`FUB_MCP_SYSTEM_NAME` is also provided.

The optional macOS `setup --local` command performs a live `/me` validation,
writes the fallback key file, and edits Claude Desktop's configuration. It is not
an offline test or a headless Linux installer. See [key security](SECURITY-GUIDE.md).

## Platform status

Except for the explicitly scoped Grok observation above, these are documentation-based
assessments. None are platform certifications:

| Product | Verified platform capability | Status for this repository |
|---|---|---|
| Claude Desktop | Existing `.mcpb`/stdio implementation in this repo; maintainer reports Mac/Windows tests | Local route documented; no fresh GUI test in this review |
| OpenAI Dot | [Installed account plugins](https://learn.chatgpt.com/docs/dots/computers-and-apps); [general remote MCP guide](https://developers.openai.com/api/docs/guides/custom-mcp-server) | Dot-specific custom installation remains conditional on connector availability and testing; Codex local stdio settings do not establish Dot support |
| Grok Bot | [Command MCP and Remote HTTPS](https://docs.x.ai/grok-bot/team-bots) | Command mode passed the one-account test described above; remote mode still needs new server/auth code |
| Muse | [Custom API connectors and Secure Credentials Store](https://www.meta.com/help/superintelligence/1687253048996149/) | MCP transport and exact installation path unverified; no promised MCP setup |
| Claude Duet | [Inherited connectors and limitations](https://support.claude.com/en/articles/17631495-get-started-with-claude-duet) | No verified arbitrary local stdio path; [general remote connectors](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp) do not prove Duet compatibility |

For Grok Team Bots, credential-bearing Command tools are restricted to the owner's
chat; a keyed remote connector uses the bot credential for everyone, while individual
OAuth can provide teammate identities. Personal Bots can share a computer, files and
CLI credentials, and installed packages may be replaced. Private chats do not provide
OS isolation. Review [computer and apps behavior](https://docs.x.ai/grok-bot/computer-and-apps).
Use a personal isolated deployment first. Do not promise team safety until there is
real caller-to-credential authorization and tenant isolation.
