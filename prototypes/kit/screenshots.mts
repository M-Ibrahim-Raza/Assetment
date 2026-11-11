// Screenshots one prototype screen: each variant and scenario at 320, 375, 768, 1280 and 1920 px,
// in the light and the dark theme. Lists sideways scroll, console errors and failed loads, and
// exits with 1 if there are any. Start the prototype with `pnpm proto` first, then run from the repo root:
//   node prototypes/kit/screenshots.mts /accounts/new --variants a,b --themes dark
// Without --scenarios, it takes every scenario in the ProtoBar. It reads the ProtoBar, so keep the two in step.
// The theme is the device's: the app's default, Auto, follows it.
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:3001";
const WIDTHS = [320, 375, 768, 1280, 1920];
const THEMES = ["light", "dark"] as const;
type Theme = (typeof THEMES)[number];
const HEIGHT = 900;
// The first visit to a route compiles it, which takes a while in dev.
const TIMEOUT_MS = 60_000;
const BAR = 'nav[aria-label="Prototype controls"]';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    variants: { type: "string", default: "a" },
    scenarios: { type: "string" },
    themes: { type: "string", default: THEMES.join(",") },
    out: { type: "string" },
  },
});

const list = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");

const isTheme = (value: string): value is Theme =>
  (THEMES as readonly string[]).includes(value);

const route = positionals[0];
const themes = list(values.themes);
if (
  route?.startsWith("/") !== true ||
  themes.length === 0 ||
  !themes.every(isTheme)
) {
  console.error(
    "Usage: node prototypes/kit/screenshots.mts <url> [--variants a,b] [--scenarios default,empty] [--themes light,dark] [--out <dir>]",
  );
  process.exit(2);
}

try {
  await fetch(BASE_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
} catch {
  console.error(
    `Nothing answers at ${BASE_URL}. Start the prototype with \`pnpm proto\`, then run this again.`,
  );
  process.exit(1);
}

const open = (page: Page, query: string) =>
  page.goto(`${BASE_URL}${route}${query}`, {
    waitUntil: "networkidle",
    timeout: TIMEOUT_MS,
  });

const slug = route.replaceAll(/[^a-z0-9]+/gi, "-").replaceAll(/^-|-$/g, "");
const outDir =
  values.out ??
  path.join(os.tmpdir(), "proto-screenshots", slug === "" ? "index" : slug);
await mkdir(outDir, { recursive: true });

const variants = list(values.variants);
const problems: string[] = [];
let shots = 0;

const browser = await chromium.launch();
try {
  let scenarios: string[];
  if (values.scenarios === undefined) {
    const page = await browser.newPage();
    await open(page, "");
    scenarios = await page.locator(`${BAR} select option`).allTextContents();
    await page.close();
  } else {
    scenarios = list(values.scenarios);
  }
  if (scenarios.length === 0) {
    problems.push(`${route}: no ProtoBar, so no scenarios to shoot`);
  }

  const runs = themes.flatMap((theme) =>
    WIDTHS.map((width) => ({ theme, width })),
  );
  for (const { theme, width } of runs) {
    const page = await browser.newPage({
      viewport: { width, height: HEIGHT },
      colorScheme: theme,
    });
    let shot = "";
    page.on("console", (message) => {
      if (message.type() === "error") {
        problems.push(`${shot}: console error: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      problems.push(`${shot}: page error: ${error.message}`);
    });

    for (const variant of variants) {
      for (const scenario of scenarios) {
        shot = `${variant}-${scenario}-${theme}-${String(width)}`;
        const response = await open(
          page,
          `?variant=${encodeURIComponent(variant)}&scenario=${encodeURIComponent(scenario)}`,
        );
        if (response?.ok() === false) {
          problems.push(`${shot}: HTTP ${String(response.status())}`);
          continue;
        }

        // An unknown key silently falls back to the default, so check what the ProtoBar shows.
        const picker = page.locator(`${BAR} select`);
        if ((await picker.count()) === 0) {
          problems.push(`${shot}: no ProtoBar`);
        } else if ((await picker.inputValue()) !== scenario) {
          problems.push(`${shot}: no scenario "${scenario}"`);
        }
        const switcher = page.locator(`${BAR} [aria-live="polite"]`);
        if (
          (await switcher.count()) > 0 &&
          !(await switcher.innerText()).startsWith(variant.toUpperCase())
        ) {
          problems.push(`${shot}: no variant "${variant}"`);
        }

        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        if (overflow > 0) {
          problems.push(`${shot}: sideways scroll of ${String(overflow)} px`);
        }

        await page.screenshot({
          path: path.join(outDir, `${shot}.png`),
          fullPage: true,
          animations: "disabled",
        });
        shots += 1;
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(`${String(shots)} screenshots in ${outDir}`);
if (problems.length > 0) {
  console.log(`${String(problems.length)} problems:`);
  for (const problem of problems) console.log(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log("No sideways scroll, console errors or failed loads.");
}
