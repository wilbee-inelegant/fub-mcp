# Fresh desktop installation check for 0.3.0

Status: not performed in this review. Headless Linux/Windows tests and local macOS
stdio tests passed; they do not exercise Claude Desktop's installation/settings UI.
This procedure checks the real release bundle with a synthetic credential and does
not require a live CRM call.

## Use an isolated desktop environment

Use a spare test machine or a separate OS user profile on each target platform:
macOS and Windows. The tester must arrange that environment and any required Claude
sign-in. A new chat in the existing profile is not isolation: installing the same
`fub-mcp` extension can replace the live extension and its saved settings.

Do not install, uninstall, overwrite or toggle the extension in Will's normal Claude
profile without separate approval. Creating profiles, installing applications or
changing a live host configuration are not actions performed by the repository QA.
Never copy his FUB key, system key or existing Claude configuration into the test.

## Record the evidence

Record OS/version/architecture, Claude Desktop version, available Node runtime,
merged commit and the bundle SHA-256. Build the exact reviewed commit using
`npm run build:mcpb`; verify `shasum -a 256 -c fub-mcp-0.3.0.mcpb.sha256` on macOS
or `Get-FileHash .\fub-mcp-0.3.0.mcpb -Algorithm SHA256` on Windows. Compare against
the build's checksum. The bundle is unsigned. Record any installation warning and
whether the host accepts the declared Node support range.

## Check installation and access settings

1. In the isolated Claude Desktop profile, open Settings → Extensions → Advanced
   settings → Install Extension (labels can vary) and select the actual versioned
   MCPB. Do not use a modified test bundle for this check.
2. Enter `synthetic-desktop-qa-not-a-key` in the API-key field. Leave system fields
   blank. Verify key fields are masked and **View and update records**, deletes,
   webhooks and direct workflow triggers all default off.
3. Enable the extension. Inspect its tool list in the host's extension/tools UI:
   viewing mode should expose 70 tools, including `get_person`, and should not expose
   `create_note`, `delete_person`, `create_webhook` or workflow-trigger tools.
4. Turn **View and update records** on, restart the extension/host and inspect the
   tool list again: 126 tools, including `create_note`; deletes, webhook changes and
   direct workflow triggers should still be absent. Check that the enabled setting
   survives a full quit/reopen.
5. Turn updates off, restart again, and verify the 70-tool viewing list returns.
   Verify the masked field remains masked, and inspect host logs privately for the
   synthetic marker; it should not appear in application log messages. Record only
   pass/fail and redacted errors, not complete logs or credential screenshots.
6. Remove the test extension from the isolated profile and discard the synthetic
   setting. Do not remove or alter any live profile's extension.

Do not invoke read or write tools against FUB with this credential. Tool discovery
and settings checks are enough for this GUI gate; mocked protocol tests cover actual
read/write dispatch and direct-call denial. If the host cannot expose tool lists or
run the supported runtime, record the exact blocked step rather than marking it
passed. No test result should depend on a model voluntarily refusing a write.

An end-to-end test against real FUB is a separate optional exercise requiring
explicit authorization, a disposable/test account and separately scoped operations.
It has not been performed, is not needed to verify the above UI behavior, and must
not be improvised on the production account. No extra credentials need be created
for this offline GUI checklist.
