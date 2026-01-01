import { chromium, Browser } from "playwright";
import { getExtractor } from "./extractors/index.js";

export interface PriceResult {
  url: string;
  name: string;
  price: number | null;
  error?: string;
}

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function fetchPrice(url: string): Promise<PriceResult> {
  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle" });

    const name = await page.title();
    const extractor = getExtractor(url);

    if (!extractor) {
      return { url, name, price: null, error: "No extractor for this domain" };
    }

    const price = await extractor.extract(page);

    if (price === null) {
      return { url, name, price: null, error: "Price not found" };
    }

    return { url, name, price };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { url, name: "", price: null, error: message };
  } finally {
    await page.close();
  }
}

export async function fetchAllPrices(urls: string[]): Promise<PriceResult[]> {
  const results: PriceResult[] = [];
  for (const url of urls) {
    results.push(await fetchPrice(url));
  }
  return results;
}
