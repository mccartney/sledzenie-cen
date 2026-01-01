import type { Page } from "playwright";
import type { Extractor } from "./types.js";

export const damian: Extractor = {
  async extract(page: Page): Promise<number | null> {
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

    // Extract price
    const priceText = await page.evaluate(() => {
      const priceEl = document.querySelector(".price-field--font-size-lg-2");
      if (priceEl) {
        const text = priceEl.textContent || "";
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
