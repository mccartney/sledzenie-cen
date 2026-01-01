import { readFileSync } from "fs";
import { resolve } from "path";
import { fetchAllPrices, closeBrowser } from "./scraper.js";
import { appendPrices } from "./sheets.js";

async function main() {
  const urlsPath = resolve(process.cwd(), "urls.txt");
  const content = readFileSync(urlsPath, "utf-8");
  const urls = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (urls.length === 0) {
    console.error("No URLs found in urls.txt");
    process.exit(1);
  }

  console.log(`Fetching prices for ${urls.length} URL(s)...`);
  const results = await fetchAllPrices(urls);

  for (const result of results) {
    if (result.price !== null) {
      console.log(`${result.name}: ${result.price} PLN`);
    } else {
      console.log(`${result.url}: ERROR - ${result.error}`);
    }
  }

  console.log("Appending to Google Sheets...");
  await appendPrices(results);
  await closeBrowser();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
