import { supabase } from "@/integrations/supabase/client";
import Fuse from "fuse.js";

export interface Book {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  genre: string | null;
  publisher: string | null;
  year: number | null;
  additional_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ExtractedBook {
  title: string;
  author?: string;
  isbn?: string;
}

export interface MatchResult {
  extracted: ExtractedBook;
  match: Book | null;
  confidence: number;
  alternativeMatches: Array<{ book: Book; score: number }>;
}

export async function fetchBooks(): Promise<Book[]> {
  try {
    const { data, error } = await supabase.from("books").select("*").order("title");
    
    if (error) {
      console.error("Supabase error object:", JSON.stringify(error));
      throw new Error(error.message || "Failed to fetch books from database");
    }
    
    if (!data) {
      throw new Error("No data returned from database");
    }
    
    return data as Book[];
  } catch (err) {
    console.error("FetchBooks catch block - error:", err);
    
    // Handle different error types
    if (err instanceof TypeError) {
      // Network error (Failed to fetch)
      console.error("Network error detected");
      throw new Error("Cannot connect to the library database. Please check your internet connection or Supabase configuration.");
    }
    
    if (err instanceof Error) {
      console.error("Error message:", err.message);
      throw err;
    }
    
    throw new Error(`An unexpected error occurred: ${String(err)}`);
  }
}

export async function insertBooks(books: Omit<Book, "id" | "created_at" | "updated_at">[]): Promise<void> {
  const payload = books.map(b => ({
    ...b,
    additional_metadata: b.additional_metadata as unknown as Record<string, never>,
  }));
  const { error } = await supabase.from("books").insert(payload);
  if (error) throw error;
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}

export async function scanImage(imageBase64: string): Promise<ExtractedBook[]> {
  const { data, error } = await supabase.functions.invoke("ocr-scan", {
    body: { imageBase64 },
  });
  if (error) throw error;
  return data?.books || [];
}

export function matchBooks(extracted: ExtractedBook[], library: Book[]): MatchResult[] {
  if (library.length === 0) return extracted.map((e) => ({ extracted: e, match: null, confidence: 0, alternativeMatches: [] }));

  const fuse = new Fuse(library, {
    keys: [
      { name: "title", weight: 0.6 },
      { name: "author", weight: 0.3 },
      { name: "isbn", weight: 0.1 },
    ],
    threshold: 0.5,
    includeScore: true,
    ignoreLocation: true,
  });

  return extracted.map((ext) => {
    // Try ISBN exact match first
    if (ext.isbn) {
      const isbnMatch = library.find((b) => b.isbn && b.isbn.replace(/[-\s]/g, "") === ext.isbn!.replace(/[-\s]/g, ""));
      if (isbnMatch) {
        return { extracted: ext, match: isbnMatch, confidence: 100, alternativeMatches: [] };
      }
    }

    const query = [ext.title, ext.author].filter(Boolean).join(" ");
    const results = fuse.search(query);

    if (results.length === 0) {
      return { extracted: ext, match: null, confidence: 0, alternativeMatches: [] };
    }

    const best = results[0];
    const confidence = Math.round((1 - (best.score || 0)) * 100);
    const alternatives = results.slice(1, 4).map((r) => ({
      book: r.item,
      score: Math.round((1 - (r.score || 0)) * 100),
    }));

    return { extracted: ext, match: best.item, confidence, alternativeMatches: alternatives };
  });
}

export function searchBooks(library: Book[], query: string): Book[] {
  if (!query.trim()) return library;
  const fuse = new Fuse(library, {
    keys: ["title", "author", "isbn", "genre", "publisher"],
    threshold: 0.4,
    ignoreLocation: true,
  });
  return fuse.search(query).map((r) => r.item);
}
