import { Book, searchBooks } from "@/lib/bookService";
import { Search, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface BookListProps {
  books: Book[];
  onDelete: (id: string) => void;
}

export function BookList({ books, onDelete }: BookListProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => searchBooks(books, query), [books, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search books by title, author, ISBN..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} of {books.length} books</p>

      <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
        {filtered.map((book, i) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(i * 0.02, 0.5) }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 group transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{book.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {[book.author, book.genre, book.year].filter(Boolean).join(" · ")}
              </p>
            </div>
            {book.isbn && <span className="text-xs text-muted-foreground hidden sm:block">{book.isbn}</span>}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
              onClick={() => onDelete(book.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No books found</p>
        )}
      </div>
    </div>
  );
}
