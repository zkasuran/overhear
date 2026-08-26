// End-to-end smoke: drive the real app in headless Chrome through the full
// M3 -> Speech 2.8 -> Music 3.0 -> browser-mix pipeline and assert we get a
// playable episode. Uses the workspace's cached playwright-core + system Chrome.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("/home/asuran/Downloads/hackathon-hq/work/_formfill/node_modules/playwright-core");

const BASE = process.env.BASE || "http://localhost:3005";
const TOPIC = process.env.TOPIC || "Why do cats purr?";

const errors = [];
const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

try {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.screenshot({ path: "artifacts/ui-idle.png", fullPage: true });

  await page.fill("textarea", TOPIC);
  await page.getByRole("button", { name: "Generate episode" }).click();

  console.log("generating (script -> voices -> theme -> mix)…");
  await page.waitForSelector("a[download]", { timeout: 300000 });
  // let the blob metadata settle
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const a = document.querySelector("audio");
    const title = document.querySelector("h2")?.textContent || "";
    const lines = document.querySelectorAll("section button").length;
    return {
      src: a?.src?.slice(0, 12) || "",
      duration: a?.duration ?? null,
      title,
      transcriptButtons: lines,
    };
  });
  await page.screenshot({ path: "artifacts/ui-ready.png", fullPage: true });

  console.log("RESULT:", JSON.stringify(info, null, 2));
  const ok = info.src.startsWith("blob:") && Number(info.duration) > 5;
  console.log("console errors:", errors.length ? errors : "none");
  console.log(ok ? "\n✅ E2E PASS: playable episode assembled." : "\n❌ E2E FAIL");
  await browser.close();
  process.exit(ok && errors.length === 0 ? 0 : 1);
} catch (e) {
  await page.screenshot({ path: "artifacts/ui-error.png", fullPage: true }).catch(() => {});
  console.log("E2E ERROR:", e.message);
  console.log("console errors:", errors);
  await browser.close();
  process.exit(1);
}
