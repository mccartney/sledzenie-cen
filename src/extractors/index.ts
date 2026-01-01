import type { Extractor } from "./types.js";
import { alab } from "./alab.js";
import { diag } from "./diag.js";
import { damian } from "./damian.js";

const extractors: Record<string, Extractor> = {
  "www.alab.pl": alab,
  "alab.pl": alab,
  "diag.pl": diag,
  "www.diag.pl": diag,
  "sklep.damian.pl": damian,
  "www.sklep.damian.pl": damian,
};

export function getExtractor(url: string): Extractor | null {
  const hostname = new URL(url).hostname;
  return extractors[hostname] ?? null;
}

export type { Extractor } from "./types.js";
