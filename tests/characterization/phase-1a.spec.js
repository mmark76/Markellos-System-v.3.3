const fs = require("node:fs");
const path = require("node:path");
const { expect, frozenCdnRoutes, test } = require("../helpers/characterization-test");

const representativePgn = fs.readFileSync(
  path.join(__dirname, "..", "fixtures", "pgn", "representative-legal-game.pgn"),
  "utf8"
);

async function waitForMainApplication(page) {
  await page.goto("/app.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#restoreDefaultLibrariesBtn")).toBeVisible();
  await expect(page.locator(".table-wrapper > .table-toolbar")).toHaveCount(5);
  await expect(page.locator("#epicModal")).toHaveCount(1);
  await expect(page.locator("#sanTextModal")).toHaveCount(1);
  await expect(page.locator("#feedbackModal")).toHaveCount(1);
  await expect(page.locator("#importLibraryBtn")).toHaveAttribute("data-direct-import-ready", "1");
  await expect(page.locator(".pao09-educational-note")).toHaveCount(1);
  await page.evaluate(() => document.fonts && document.fonts.ready);
}

function assertStandardNetworkPolicy(networkAudit) {
  expect(new Set(networkAudit.intercepted)).toEqual(
    new Set(frozenCdnRoutes.keys())
  );
}

test("landing page smoke test records its primary DOM and text", async ({ page, networkAudit }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveTitle("Chess Mnemonic System");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What Is the Chess Mnemonic System?");
  await expect(page.getByRole("link", { name: "Open the Chess Mnemonic App" })).toHaveAttribute("href", "app.html");
  await expect(page.getByRole("link", { name: "Memory Palaces Trainer" })).toHaveAttribute("href", "flashcards/index.html");

  const state = await page.evaluate(() => ({
    actionLinks: Array.from(document.querySelectorAll(".actions a")).map((link) => ({
      href: link.getAttribute("href"),
      text: link.textContent.trim()
    })),
    heading: document.querySelector("h1")?.textContent.trim(),
    mainSectionHeadings: Array.from(document.querySelectorAll("main > section > h2")).map((heading) => heading.textContent.trim()),
    title: document.title
  }));

  expect(JSON.stringify(state, null, 2)).toMatchSnapshot("landing-dom.json");
  expect(networkAudit.intercepted).toEqual([]);
  expect(networkAudit.blocked).toEqual([]);
});

test("main application initial-render smoke test records current defaults", async ({ page, networkAudit }) => {
  await waitForMainApplication(page);

  await expect(page).toHaveTitle("Chess Mnemonic Application and Epic Chess Stories Creator");
  await expect(page.locator("#locusMode")).toHaveValue("full");
  await expect(page.locator("#epicLocusMode")).toHaveValue("half");
  await expect(page.locator("#tableSelect")).toHaveValue("sanSection");
  await expect(page.locator("#sanSection")).toBeVisible();
  await expect(page.locator("#assocSection")).toBeHidden();
  await expect(page.locator("#openSanToTextBtn")).toBeDisabled();

  const state = await page.evaluate(() => {
    const sectionIds = ["sanSection", "assocSection", "shortnamesSection", "pao99Section", "paoSection"];
    return {
      downloadFormats: Array.from(document.querySelectorAll(".download-select")).map((select) =>
        Array.from(select.options).map((option) => option.value)
      ),
      dynamicElements: [
        "epicModal",
        "sanTextModal",
        "feedbackModal",
        "restoreDefaultLibrariesBtn",
        "openSanToTextBtn"
      ].map((id) => ({ id, present: Boolean(document.getElementById(id)) })),
      epicLocusMode: document.getElementById("epicLocusMode")?.value,
      libraryStatus: document.getElementById("userLibraryStatus")?.innerText.trim(),
      locusMode: document.getElementById("locusMode")?.value,
      rowCounts: {
        associations: document.querySelectorAll("#assocBody tr").length,
        pao00To99: document.querySelectorAll("#pao99Body tr").length,
        pao0To9: document.querySelectorAll("#paoBody tr").length,
        san: document.querySelectorAll("#sanBody tr").length,
        shortnames: document.querySelectorAll("#shortnamesBody tr").length
      },
      sections: sectionIds.map((id) => ({
        display: getComputedStyle(document.getElementById(id)).display,
        id
      })),
      tableHeaders: sectionIds.map((id) => ({
        headers: Array.from(document.querySelectorAll(`#${id} thead th`)).map((cell) => cell.textContent.trim()),
        id
      })),
      tableSelect: document.getElementById("tableSelect")?.value,
      title: document.title,
      toolbarCount: document.querySelectorAll(".table-wrapper > .table-toolbar").length
    };
  });

  expect(JSON.stringify(state, null, 2)).toMatchSnapshot("main-initial-dom.json");
  assertStandardNetworkPolicy(networkAudit);
  expect(networkAudit.blocked.length).toBeGreaterThan(0);
});

test("main application desktop screenshot", async ({ page, networkAudit }) => {
  await waitForMainApplication(page);
  await expect(page).toHaveScreenshot("main-desktop.png", { fullPage: true });
  assertStandardNetworkPolicy(networkAudit);
});

test("main application mobile screenshot", async ({ page, networkAudit }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await waitForMainApplication(page);
  await expect(page).toHaveScreenshot("main-mobile.png", { fullPage: true });
  assertStandardNetworkPolicy(networkAudit);
});

test("representative legal PGN paste and parse records all table DOM text", async ({ page, networkAudit }) => {
  await waitForMainApplication(page);
  await page.locator("#pgnText").fill(representativePgn);
  await page.locator("#parsePgnBtn").click();

  await expect(page.locator("#sanBody tr")).toHaveCount(10);
  await expect(page.locator("#assocBody tr")).toHaveCount(10);
  await expect(page.locator("#shortnamesBody tr")).toHaveCount(10);
  await expect(page.locator("#paoBody tr")).toHaveCount(10);
  await expect(page.locator("#pao99Body tr")).toHaveCount(5);
  await expect(page.locator("#openSanToTextBtn")).toBeEnabled();

  const state = await page.evaluate(() => {
    function rows(bodyId) {
      return Array.from(document.querySelectorAll(`#${bodyId} tr`)).map((row) =>
        Array.from(row.cells).map((cell) => ({
          display: cell.style.display,
          text: cell.innerText.replace(/\r?\n/g, " | ").trim()
        }))
      );
    }

    return {
      associations: rows("assocBody"),
      locusMode: document.getElementById("locusMode")?.value,
      pao00To99: rows("pao99Body"),
      pao0To9: rows("paoBody"),
      san: rows("sanBody"),
      shortnames: rows("shortnamesBody"),
      textarea: document.getElementById("pgnText")?.value
    };
  });

  expect(state.san.map((row) => row[1].text)).toEqual([
    "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"
  ]);
  expect(state.san.filter((row) => row[3].text).length).toBe(5);
  expect(state.locusMode).toBe("full");
  expect(JSON.stringify(state, null, 2)).toMatchSnapshot("representative-legal-pgn-dom.json");
  assertStandardNetworkPolicy(networkAudit);
});
