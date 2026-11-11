# IKunCode Usage for DSH

A standalone IKunCode account balance card for DeepSeek Harness. Displays the provider name and CNY account balance regardless of the selected model. Coexists with upstream usage plugins without modifying them. Does not display model prices or cumulative usage.

## Installation

Download `dsh-ikuncode-usage.tgz` from [Releases](https://github.com/elsebit/dsh-ikuncode-usage/releases), then install it using the Desktop plugin manager. Do not unpack it. For standalone Web profiles:

```sh
dsh plugin --profile web add https://github.com/elsebit/dsh-ikuncode-usage/releases/latest/download/dsh-ikuncode-usage.tgz
```

Desktop users should use their application's plugin manager; the `web` profile is not necessarily the Desktop profile. Follow the host's refresh or restart instructions. Supported dependencies are declared in package.json. Do not force version exemptions.

## Configuration

The host reads the API key through DSH's credential service. The default reference is `IKUNCODE_API_KEY`. The plugin does not bundle, write, log, or return the key to the browser.

Set the plugin's `credentialRef` option to the **credential reference name already used by your IKunCode provider**, not the key itself. The Models page typically derives this reference from the provider ID: `my-ikuncode` becomes `MY_IKUNCODE_API_KEY`. An existing reference avoids storing the key twice. Alternatively, configure `IKUNCODE_API_KEY` in the environment that starts DSH; a GUI process may not inherit a terminal's environment.

Use a credential dedicated to IKunCode. Never select an official provider's key or an account-login/OAuth grant. The key is sent only to `https://api.ikuncode.cc/api/usage/token/`, with redirects disabled. Arbitrary endpoints are not supported.

Click the card to refresh. The browser refreshes once per minute while visible. Successful host reads are cached for 30 seconds. Missing or failed readings display a placeholder and a generic error, never a fabricated zero. No model inference requests are made.

## Account balance

Only `data.user_quota.total_available` is used, never token limits. Public site status is checked first. The supported display configuration is CNY, a positive `quota_per_unit`, and `usd_exchange_rate = 1`. Unsupported currency configurations fail closed rather than guessing a conversion.

## Privacy and security

- No personal keys, user settings, balance history, or logs are distributed.
- The endpoint accepts same-origin loopback requests only. Remote and LAN exposure are not supported.
- Requests use timeouts, bounded response sizes, fixed HTTPS destinations, and disabled redirects. Exception details are not logged or sent to the browser.
- Installed DSH plugins run with the host's privileges. A market listing is not a security audit.
- GitHub and IKunCode may retain service and network logs. This plugin cannot guarantee anonymity.

## Development and releases

Requires Node.js 24 or later:

```sh
npm test
npm pack --ignore-scripts
```

Tests use synthetic inputs only. Real Desktop rendering and credential configuration require an installed-host check.

The release workflow tests the project, verifies that the tag matches the package version, builds a standard npm archive, and publishes `dsh-ikuncode-usage.tgz` plus its SHA256 checksum. To release, update the package version, commit, and push the corresponding `v*` tag. GitHub Actions uses its repository-scoped temporary token; no model API keys or personal publishing tokens are required.

Updating this independent plugin does not require merging upstream usage-plugin changes. Market review is separate from publishing a Release. Publication does not imply market approval or automatic updates on users' machines.

## Background

This project follows an experiment adding IKunCode support to [dougen/dsh-deepseek-usage](https://github.com/dougen/dsh-deepseek-usage). This standalone implementation does not redistribute that plugin or overwrite its routes, configuration, package, or UI. Not affiliated with IKunCode or DeepSeek.

MIT - elsebit
