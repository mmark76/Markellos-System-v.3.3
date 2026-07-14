const { test: base, expect } = require("@playwright/test");
const { installSpeechSynthesisMock } = require("./speech-synthesis-mock");

const frozenCdnRoutes = new Map([
  ["https://code.jquery.com/jquery-3.6.0.min.js", require.resolve("jquery/dist/jquery.min.js")],
  ["https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js", require.resolve("chess.js")],
  ["https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js", require.resolve("papaparse/papaparse.min.js")],
  ["https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js", require.resolve("file-saver/dist/FileSaver.min.js")],
  ["https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", require.resolve("jszip/dist/jszip.min.js")]
]);

const blockedHostPatterns = [
  /(^|\.)googletagmanager\.com$/,
  /(^|\.)google-analytics\.com$/,
  /(^|\.)translate\.google\.com$/,
  /(^|\.)translate\.googleapis\.com$/,
  /(^|\.)copyrighted\.com$/,
  /^stats\.chessmnemonics\.net$/
];

function sortedUnique(values) {
  return Array.from(new Set(values)).sort();
}

const test = base.extend({
  browserRuntime: [async ({ browser }, use) => {
    const executablePath = process.env.CMA_BROWSER_EXECUTABLE_PATH
      || browser.browserType().executablePath();
    const runtime = {
      executablePath,
      version: browser.version()
    };
    console.log(`BROWSER_RUNTIME ${JSON.stringify(runtime)}`);
    await use(runtime);
  }, { auto: true, scope: "worker" }],

  speechMock: [async ({ page }, use) => {
    await installSpeechSynthesisMock(page);
    await use();
  }, { auto: true }],

  networkAudit: [async ({ page }, use, testInfo) => {
    const audit = {
      blocked: [],
      intercepted: [],
      unexpectedExternal: []
    };

    await page.route("**/*", async (route) => {
      const request = route.request();
      const url = request.url();
      const frozenPath = frozenCdnRoutes.get(url);

      if (frozenPath) {
        audit.intercepted.push(url);
        await route.fulfill({
          contentType: "application/javascript; charset=utf-8",
          path: frozenPath
        });
        return;
      }

      const parsed = new URL(url);
      const isLocal = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
      if (isLocal) {
        await route.continue();
        return;
      }

      if (blockedHostPatterns.some((pattern) => pattern.test(parsed.hostname))) {
        audit.blocked.push(url);
      } else {
        audit.unexpectedExternal.push(url);
      }
      await route.abort("blockedbyclient");
    });

    await use(audit);
    await page.close();

    const report = {
      blocked: sortedUnique(audit.blocked),
      intercepted: sortedUnique(audit.intercepted),
      unexpectedExternal: sortedUnique(audit.unexpectedExternal)
    };
    if (process.env.CMA_REPORT_NETWORK === "1") {
      console.log(`NETWORK_AUDIT ${testInfo.title}: ${JSON.stringify(report)}`);
    }
    await testInfo.attach("network-audit", {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: "application/json"
    });
    expect(
      report.unexpectedExternal,
      "Unexpected external requests must fail characterization tests"
    ).toEqual([]);
  }, { auto: true }]
});

module.exports = {
  blockedHostPatterns,
  expect,
  frozenCdnRoutes,
  test
};
