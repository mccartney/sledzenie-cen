# Price Tracker

Scrapes diagnostic package prices from Polish lab websites, stores in Google Sheets. Runs daily via GitHub Actions.

## Structure

- `urls.txt` - URLs to scrape (one per line)
- `src/extractors/` - per-domain price extractors
- `src/scraper.ts` - orchestrates fetching with Playwright
- `src/sheets.ts` - Google Sheets API integration

## Adding a new site

1. Create `src/extractors/newsite.ts`:
```ts
import type { Page } from "playwright";
import type { Extractor } from "./types.js";

export const newsite: Extractor = {
  async extract(page: Page): Promise<number | null> {
    // Use page.evaluate() or page interactions to get price
    return price;
  },
};
```

2. Register in `src/extractors/index.ts`:
```ts
import { newsite } from "./newsite.js";
const extractors = { ..., "newsite.pl": newsite };
```

3. Add URL to `urls.txt`

## Testing

```bash
npm install
npx playwright install chromium
npx tsx src/index.ts  # needs GOOGLE_CREDENTIALS env var
```

## Google Sheets

Spreadsheet ID hardcoded in `src/sheets.ts`. Service account needs Editor access.
