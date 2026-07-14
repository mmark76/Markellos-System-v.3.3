const { defineConfig } = require("@playwright/test");

const browserExecutablePath = process.env.CMA_BROWSER_EXECUTABLE_PATH;

module.exports = defineConfig({
  testDir: "./tests/characterization",
  outputDir: "./tests/.artifacts",
  preserveOutput: "never",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 7_500,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixels: 0
    }
  },
  reporter: [["line"]],
  snapshotPathTemplate: "{testDir}/../snapshots/{testFilePath}/{arg}{ext}",
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    locale: "en-GB",
    timezoneId: "Asia/Nicosia",
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    launchOptions: browserExecutablePath
      ? { executablePath: browserExecutablePath }
      : {},
    serviceWorkers: "block",
    trace: "off",
    video: "off"
  },
  webServer: {
    command: "node tests/helpers/static-server.js --port 4173",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: false,
    timeout: 15_000
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" }
    }
  ]
});
