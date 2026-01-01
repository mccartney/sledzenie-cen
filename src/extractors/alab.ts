import type { Page } from "playwright";
import type { Extractor } from "./types.js";

export const alab: Extractor = {
  async extract(page: Page): Promise<number | null> {
    const priceText = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      const labelMatch = bodyText.match(
        /Cena\s*badania[:\s]*(\d+(?:[.,]\d+)?)\s*(?:zł|PLN)/i
      );
      if (labelMatch) {
        return labelMatch[1].replace(",", ".");
      }

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

      return null;
    });

    return priceText ? parseFloat(priceText) : null;
  },
};
