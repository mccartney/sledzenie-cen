import * as cheerio from "cheerio";

export interface PriceResult {
  url: string;
  name: string;
  price: number | null;
  error?: string;
}

export async function fetchPrice(url: string): Promise<PriceResult> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return { url, name: "", price: null, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let name = "";
    let price: number | null = null;

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || "");
        const data = Array.isArray(json) ? json : [json];

        for (const item of data) {
          if (item.offers) {
            const offers = Array.isArray(item.offers)
              ? item.offers
              : [item.offers];
            for (const offer of offers) {
              if (offer.price && offer.priceCurrency === "PLN") {
                price = parseFloat(offer.price);
                name = item.name || "";
                return false;
              }
            }
          }
        }
      } catch {
        // ignore invalid JSON
      }
    });

    if (price === null) {
      return { url, name, price: null, error: "Price not found" };
    }

    return { url, name, price };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { url, name: "", price: null, error: message };
  }
}

export async function fetchAllPrices(urls: string[]): Promise<PriceResult[]> {
  return Promise.all(urls.map(fetchPrice));
}
