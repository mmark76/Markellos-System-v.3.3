# Characterization Environment

This document defines the Phase 1A browser environment used to record the existing Chess Mnemonic Application without changing production files.

## Runtime

- Supported baseline runtime: Node.js `24.16.0`.
- Test runner: Playwright Test `1.55.1`, pinned exactly in `package.json` and `package-lock.json`.
- Authoritative browser engine: the Playwright-managed Chromium revision associated with the pinned Playwright release. The configuration does not discover or select an installed system browser automatically.
- Locale: `en-GB`.
- Timezone: `Asia/Nicosia`.
- Desktop viewport: `1440 × 1000`.
- Mobile viewport: `390 × 844`.
- Colour scheme: light.
- Service workers: blocked for test isolation.
- Application server: the test-only Node static server in `tests/helpers/static-server.js` at `http://127.0.0.1:4173`.

The static server serves the repository root with `Cache-Control: no-store`. It exists only for tests and does not change the production hosting model.

## Frozen functional CDN dependencies

Production HTML remains unchanged. During tests, Playwright intercepts the exact production CDN URLs and fulfils them from exact-version, pinned test dependencies:

| Production URL | Pinned test package |
| --- | --- |
| `https://code.jquery.com/jquery-3.6.0.min.js` | `jquery@3.6.0` |
| `https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js` | `chess.js@0.10.3` |
| `https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js` | `papaparse@5.4.1` |
| `https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js` | `file-saver@2.0.5` |
| `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js` | `jszip@3.10.1` |

XLSX is not installed or intercepted in Phase 1A because none of the five tests exercises the production dynamic XLSX loader. Exact-version XLSX interception and its security boundary will be added with the deferred Excel-import characterization tests. The production loader remains unchanged.

## Blocked non-functional requests

The standard characterization fixture blocks requests to:

- Google Tag Manager and Google Analytics.
- Plausible at `stats.chessmnemonics.net`.
- Google Translate hosts.
- Copyrighted.com hosts.
- Any other unexpected non-local external host.

Every test receives a `network-audit` attachment containing the exact intercepted, blocked, and unexpected external URLs. Fixture teardown closes the page, preserves the report attachment, and automatically fails every fixture-backed test if any unexpected external request occurred, including requests initiated late in the test.

Blocking these services prevents analytics events, translation DOM mutation, third-party badge behavior, and unrelated network variability from influencing the standard baseline.

## Web Speech API foundation

`tests/helpers/speech-synthesis-mock.js` installs deterministic `SpeechSynthesisUtterance` and `speechSynthesis` objects before page scripts run. It provides:

- two fixed English voices,
- a recorded utterance queue,
- play, cancel, pause, and resume state,
- an assignable `onvoiceschanged` property.

Phase 1A uses the mock to stabilize initial Epic TTS controls. Full TTS behavior tests are intentionally deferred.

## Commands

Install the exact dependency tree from a clean clone, then install the Playwright-managed Chromium revision:

```powershell
npm.cmd ci
npx.cmd playwright install chromium
```

The Playwright-managed Chromium installation is the authoritative baseline. Only the Chromium browser engine is configured; Firefox and WebKit are not enabled. Each run reports the actual browser version and executable path as `BROWSER_RUNTIME` output.

For local diagnosis only, an installed Chromium-family executable may be selected explicitly:

```powershell
$env:CMA_BROWSER_EXECUTABLE_PATH = "<path-to-browser-executable>"
npm.cmd run test:characterization
```

`CMA_BROWSER_EXECUTABLE_PATH` is a local diagnostic override, not an authoritative visual-baseline environment. When it is absent, the configuration uses only Playwright-managed Chromium and never searches for a system browser.

Generate or intentionally update approved snapshots:

```powershell
npm.cmd run test:update-snapshots
```

Run the baseline without updating it:

```powershell
npm.cmd run test:characterization
```

Snapshot changes must be visually reviewed. A refactor must not update snapshots merely to make an unexplained visual or textual difference pass.

## Visual baseline status and CI target

The existing desktop and mobile PNGs were originally generated with installed Google Chrome `150.0.7871.101`. They remain local provisional baselines unless and until they are regenerated successfully with Playwright-managed Chromium and visually reviewed.

The future authoritative CI visual baseline must use:

- a pinned Node.js version,
- the exact pinned Playwright release,
- Playwright-managed Chromium,
- a fixed operating-system image or container and fixed fonts,
- locale `en-GB`,
- timezone `Asia/Nicosia`,
- desktop viewport `1440 x 1000`, and
- mobile viewport `390 x 844`.
