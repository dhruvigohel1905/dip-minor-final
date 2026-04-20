import * as XLSX from "xlsx";
import type { ExtractedBook } from "./bookService";

interface ParsedBook {
  title: string;
  author: string | null;
  isbn: string | null;
  genre: string | null;
  publisher: string | null;
  year: number | null;
  additional_metadata: Record<string, unknown>;
}

const FIELD_MAPPINGS: Record<string, string[]> = {
  title: ["title", "book title", "name", "book name", "book_title"],
  author: ["author", "writer", "by", "author name", "author_name", "author (student / faculties)", "author/student"],
  isbn: ["isbn", "isbn-13", "isbn-10", "isbn13", "isbn10", "accession number", "accession no"],
  genre: ["genre", "category", "subject", "type", "classification", "document type", "programme/ discipline", "programme/discipline", "discipline"],
  publisher: ["publisher", "publishing house", "press", "pub", "school", "mentor / guide", "mentor/guide"],
  year: ["year", "published", "publication year", "pub year", "year published"],
};

function findColumn(headers: string[], fieldAliases: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  for (const alias of fieldAliases) {
    // Exact match
    const idx = normalized.findIndex((h) => h === alias);
    if (idx !== -1) return idx;
  }
  // Partial/contains match as fallback
  for (const alias of fieldAliases) {
    const idx = normalized.findIndex((h) => h.includes(alias) || alias.includes(h));
    if (idx !== -1) return idx;
  }
  return -1;
}

export function parseExcelFile(file: File): Promise<ParsedBook[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) {
          reject(new Error("File must have at least a header row and one data row"));
          return;
        }

        const headers = rows[0].map((h) => String(h || ""));
        const colMap: Record<string, number> = {};
        for (const [field, aliases] of Object.entries(FIELD_MAPPINGS)) {
          colMap[field] = findColumn(headers, aliases);
        }

        if (colMap.title === -1) {
          reject(new Error("Could not find a 'Title' column. Please ensure your file has a Title column."));
          return;
        }

        const books: ParsedBook[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const title = String(row[colMap.title] || "").trim();
          if (!title) continue;

          const additional: Record<string, unknown> = {};
          headers.forEach((h, idx) => {
            const isMapped = Object.values(colMap).includes(idx);
            if (!isMapped && row[idx] !== undefined && row[idx] !== null && String(row[idx]).trim()) {
              additional[h] = row[idx];
            }
          });

          const yearRaw = colMap.year !== -1 ? row[colMap.year] : null;
          let year: number | null = null;
          if (yearRaw) {
            const n = parseInt(String(yearRaw), 10);
            if (!isNaN(n) && n > 0 && n < 3000) year = n;
          }

          books.push({
            title,
            author: colMap.author !== -1 ? String(row[colMap.author] || "").trim() || null : null,
            isbn: colMap.isbn !== -1 ? String(row[colMap.isbn] || "").trim() || null : null,
            genre: colMap.genre !== -1 ? String(row[colMap.genre] || "").trim() || null : null,
            publisher: colMap.publisher !== -1 ? String(row[colMap.publisher] || "").trim() || null : null,
            year,
            additional_metadata: additional,
          });
        }

        resolve(books);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}
