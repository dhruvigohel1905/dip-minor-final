import { type MatchResult } from "@/lib/bookService";
import { Check, AlertTriangle, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScanResultsProps {
  results: MatchResult[];
}

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 80) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent"><Check className="h-3 w-3" />{score}%</span>;
  if (score >= 50) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning"><AlertTriangle className="h-3 w-3" />{score}%</span>;
  if (score > 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive"><AlertTriangle className="h-3 w-3" />{score}%</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"><X className="h-3 w-3" />No match</span>;
}

export function ScanResults({ results }: ScanResultsProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (results.length === 0) return null;

  const matched = results.filter((r) => r.match);
  const unmatched = results.filter((r) => !r.match);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium">{results.length} books detected</span>
        <span className="text-accent">{matched.length} matched</span>
        {unmatched.length > 0 && <span className="text-destructive">{unmatched.length} unmatched</span>}
      </div>

      <div className="space-y-2">
        {results.map((result, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-lg overflow-hidden"
          >
            <button
              className="w-full p-4 flex items-start justify-between gap-3 text-left"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ConfidenceBadge score={result.confidence} />
                  <span className="text-xs text-muted-foreground truncate">OCR: "{result.extracted.title}"</span>
                </div>
                {result.match ? (
                  <div>
                    <p className="font-medium truncate">{result.match.title}</p>
                    <p className="text-sm text-muted-foreground">{result.match.author || "Unknown author"}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No match found in library</p>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded === i ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {expanded === i && result.match && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2 text-sm border-t border-border pt-3">
                    {result.match.genre && <div><span className="text-muted-foreground">Genre:</span> {result.match.genre}</div>}
                    {result.match.publisher && <div><span className="text-muted-foreground">Publisher:</span> {result.match.publisher}</div>}
                    {result.match.year && <div><span className="text-muted-foreground">Year:</span> {result.match.year}</div>}
                    {result.match.isbn && <div><span className="text-muted-foreground">ISBN:</span> {result.match.isbn}</div>}
                    {result.alternativeMatches.length > 0 && (
                      <div className="col-span-2 mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Other possible matches:</p>
                        {result.alternativeMatches.map((alt, j) => (
                          <p key={j} className="text-xs">
                            {alt.book.title} <span className="text-muted-foreground">({alt.score}%)</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
