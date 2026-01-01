import type { Page } from "playwright";
import type { Extractor } from "./types.js";

export const diag: Extractor = {
  async extract(page: Page): Promise<number | null> {
    const priceText = await page.evaluate(() => {
      for (const el of document.querySelectorAll("div")) {
        if (el.className && el.className.includes("MuiTypography-h")) {
          const text = el.textContent || "";
          const match = text.match(/^(\d+(?:[.,]\d+)?)\s*(?:zł|PLN)$/i);
          if (match) {
            return match[1].replace(",", ".");
          }
        }
      }
      return null;
    });

    return priceText ? parseFloat(priceText) : null;
  },
};
