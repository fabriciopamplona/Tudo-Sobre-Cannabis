import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { syncAnalyticsSnapshots } from "../src/lib/analytics-sync";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();
const force = process.argv.includes("--force");
const result = await syncAnalyticsSnapshots({ force });
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok || result.skipped ? 0 : 1);
