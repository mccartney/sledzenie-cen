import { google } from "googleapis";
import type { PriceResult } from "./scraper.js";

const SPREADSHEET_ID = "1EM_HjRFiHrNZQa0VEhFtPAKAW7yzVo_TZ6rPJE8e1M0";
const SHEET_NAME = "Sheet1";

function getAuth() {
  const credentials = process.env.GOOGLE_CREDENTIALS;
  if (!credentials) {
    throw new Error("GOOGLE_CREDENTIALS environment variable not set");
  }

  const parsed = JSON.parse(credentials);
  return new google.auth.GoogleAuth({
    credentials: parsed,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function ensureHeaders(
  results: PriceResult[]
): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:ZZ1`,
    valueRenderOption: "FORMULA",
  });

  const existingHeaders = (response.data.values?.[0] || []) as string[];

  if (existingHeaders.length === 0) {
    const headers = [
      "Timestamp",
      ...results.map((r) => {
        const label = r.name || r.url;
        return `=HYPERLINK("${r.url}", "${label.replace(/"/g, '""')}")`;
      }),
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    });
    return [["Timestamp", ...results.map((r) => r.url)]];
  }

  const newResults = results.filter(
    (r) => !existingHeaders.some((h) => h.includes(r.url))
  );

  if (newResults.length > 0) {
    const newHeaders = newResults.map((r) => {
      const label = r.name || r.url;
      return `=HYPERLINK("${r.url}", "${label.replace(/"/g, '""')}")`;
    });
    const startCol = String.fromCharCode(65 + existingHeaders.length);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!${startCol}1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newHeaders] },
    });
    return [[...existingHeaders, ...newResults.map((r) => r.url)]];
  }

  return [existingHeaders];
}

export async function appendPrices(results: PriceResult[]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const [headers] = await ensureHeaders(results);

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
  const row: (string | number)[] = [timestamp];

  for (let i = 1; i < headers.length; i++) {
    const header = headers[i];
    const result = results.find((r) => header.includes(r.url));
    if (result?.price !== null && result?.price !== undefined) {
      row.push(result.price);
    } else {
      row.push(result?.error || "N/A");
    }
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:Z`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}
