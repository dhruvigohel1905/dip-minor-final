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
  shelf_number: string | null;
  rack_number: string | null;
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
  isMisplaced?: boolean;
  expectedShelf?: string | null;
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
  const payload = books.map(b => {
    const { shelf_number, rack_number, ...rest } = b;
    // We keep shelf/rack only if they have values, to avoid errors on non-existent columns
    // if the user hasn't added them to Supabase yet.
    const item: any = { ...rest };
    if (shelf_number) item.shelf_number = shelf_number;
    if (rack_number) item.rack_number = rack_number;
    
    return {
      ...item,
      additional_metadata: (b.additional_metadata || {}) as any,
    };
  });
  
  const { error } = await supabase.from("books").insert(payload);
  if (error) {
    console.error("Insert error:", error);
    // Fallback: If top-level insert fails, try putting shelf/rack into metadata
    if (error.message.includes("column") && error.message.includes("not found")) {
      const fallbackPayload = books.map(b => ({
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        genre: b.genre,
        publisher: b.publisher,
        year: b.year,
        additional_metadata: {
          ...(b.additional_metadata || {}),
          shelf_number: b.shelf_number,
          rack_number: b.rack_number
        } as any
      }));
      const { error: fallbackError } = await supabase.from("books").insert(fallbackPayload);
      if (fallbackError) throw fallbackError;
    } else {
      throw error;
    }
  }
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

export function matchBooks(extracted: ExtractedBook[], library: Book[], currentShelf?: string): MatchResult[] {
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
    let match: Book | null = null;
    let confidence = 0;
    let alternatives: Array<{ book: Book; score: number }> = [];

    // Try ISBN exact match first
    if (ext.isbn) {
      const isbnMatch = library.find((b) => b.isbn && b.isbn.replace(/[-\s]/g, "") === ext.isbn!.replace(/[-\s]/g, ""));
      if (isbnMatch) {
        match = isbnMatch;
        confidence = 100;
      }
    }

    if (!match) {
      const query = [ext.title, ext.author].filter(Boolean).join(" ");
      const results = fuse.search(query);

      if (results.length > 0) {
        const best = results[0];
        match = best.item;
        confidence = Math.round((1 - (best.score || 0)) * 100);
        alternatives = results.slice(1, 4).map((r) => ({
          book: r.item,
          score: Math.round((1 - (r.score || 0)) * 100),
        }));
      }
    }

    // Misplaced detection logic
    let isMisplaced = false;
    let expectedShelf = null;

    if (match && currentShelf) {
      expectedShelf = match.shelf_number || (match.additional_metadata as any)?.shelf_number;
      if (expectedShelf && expectedShelf !== currentShelf) {
        isMisplaced = true;
      }
    }

    return { 
      extracted: ext, 
      match, 
      confidence, 
      alternativeMatches: alternatives,
      isMisplaced,
      expectedShelf
    };
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
