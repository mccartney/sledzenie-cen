import { chromium, Browser, Page } from "playwright";

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

async function handleDamian(page: Page): Promise<void> {
  // Remove cookie wrapper that blocks interactions
  await page.evaluate(() => {
    document.getElementById("cmpwrapper")?.remove();
  });

  // Select city: Warszawa
  await page.click('text="Wybierz miasto"');
  await page.waitForTimeout(500);
  await page.click('.base-form-select-list__item >> text="Warszawa"');
  await page.waitForTimeout(500);

  // Select location: Bażantarni
  await page.click('text="Wybierz placówkę"');
  await page.waitForTimeout(500);
  await page.click('.base-form-select-list__item >> text=/Bażantarni/i');
  await page.waitForTimeout(500);
}

export async function fetchPrice(url: string): Promise<PriceResult> {
  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle" });

    // Site-specific interactions
    if (url.includes("sklep.damian.pl")) {
      await handleDamian(page);
    }

    const name = await page.title();

    const priceText = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // alab.pl: "Cena badania: X zł"
      const labelMatch = bodyText.match(
        /Cena\s*badania[:\s]*(\d+(?:[.,]\d+)?)\s*(?:zł|PLN)/i
      );
      if (labelMatch) {
        return labelMatch[1].replace(",", ".");
      }

      // alab.pl fallback: price in large text spans
      const priceSpan = document.querySelector(
        'span[class*="text-xl"], span[class*="text-3xl"]'
      );
      if (priceSpan) {
        const text = priceSpan.textContent || "";
        const match = text.match(/(\d+(?:[.,]\d+)?)\s*(?:zł|PLN)/i);
        if (match) {
          return match[1].replace(",", ".");
        }
      }

      // diag.pl: price in MuiTypography heading elements
      for (const el of document.querySelectorAll("div")) {
        if (el.className && el.className.includes("MuiTypography-h")) {
          const text = el.textContent || "";
          const match = text.match(/^(\d+(?:[.,]\d+)?)\s*(?:zł|PLN)$/i);
          if (match) {
            return match[1].replace(",", ".");
          }
        }
      }

      // damian.pl: first price after location selection
      const damianPrice = document.querySelector(".price-field--font-size-lg-2");
      if (damianPrice) {
        const text = damianPrice.textContent || "";
        const match = text.match(/(\d+(?:[.,]\d+)?)\s*(?:zł|PLN)/i);
        if (match) {
          return match[1].replace(",", ".");
        }
      }

      return null;
    });

    if (!priceText) {
      return { url, name, price: null, error: "Price not found" };
    }

    return { url, name, price: parseFloat(priceText) };
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
