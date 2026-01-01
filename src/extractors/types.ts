import type { Page } from "playwright";

export interface Extractor {
  extract(page: Page): Promise<number | null>;
}
