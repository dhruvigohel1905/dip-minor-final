import { type MatchResult } from "@/lib/bookService";
import { Check, AlertTriangle, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScanResultsProps {
  results: MatchResult[];
}

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 80) return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary"><Check className="h-3.5 w-3.5" />{score}% Match</span>;
  if (score >= 50) return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning"><AlertTriangle className="h-3.5 w-3.5" />{score}% Match</span>;
  if (score > 0) return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive"><AlertTriangle className="h-3.5 w-3.5" />{score}% Match</span>;
  return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground"><X className="h-3.5 w-3.5" />No match</span>;
}

export function ScanResults({ results }: ScanResultsProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (results.length === 0) return null;

  const matched = results.filter((r) => r.match);
  const unmatched = results.filter((r) => !r.match);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm p-3 rounded-lg bg-primary/5 border border-primary/20">
        <span className="font-semibold text-foreground">{results.length} books detected</span>
        <span className="font-medium text-primary">{matched.length} matched</span>
        {unmatched.length > 0 && <span className="font-medium text-destructive">{unmatched.length} unmatched</span>}
      </div>

      <div className="space-y-2">
        {results.map((result, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-lg overflow-hidden border border-border hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <button
              className="w-full p-4 flex items-start justify-between gap-3 text-left hover:bg-primary/2 transition-colors"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <ConfidenceBadge score={result.confidence} />
                  <span className="text-xs text-muted-foreground truncate">OCR: "{result.extracted.title}"</span>
                </div>
                {result.match ? (
                  <div>
                    <p className="font-medium truncate text-foreground">{result.match.title}</p>
                    <p className="text-sm text-muted-foreground">{result.match.author || "Unknown author"}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No match found in library</p>
                )}
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${expanded === i ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {expanded === i && result.match && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 grid grid-cols-2 gap-3 text-sm border-t border-border pt-3 bg-gray-50">
                    {result.match.genre && (
                      <div>
                        <span className="text-muted-foreground font-medium">Genre:</span>
                        <p className="text-foreground">{result.match.genre}</p>
                      </div>
                    )}
                    {result.match.publisher && (
                      <div>
                        <span className="text-muted-foreground font-medium">Publisher:</span>
                        <p className="text-foreground">{result.match.publisher}</p>
                      </div>
                    )}
                    {result.match.year && (
                      <div>
                        <span className="text-muted-foreground font-medium">Year:</span>
                        <p className="text-foreground">{result.match.year}</p>
                      </div>
                    )}
                    {result.match.isbn && (
                      <div>
                        <span className="text-muted-foreground font-medium">ISBN:</span>
                        <p className="text-foreground">{result.match.isbn}</p>
                      </div>
                    )}
                    {result.alternativeMatches.length > 0 && (
                      <div className="col-span-2 mt-2 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Other possible matches:</p>
                        <div className="space-y-1">
                          {result.alternativeMatches.map((alt, j) => (
                            <p key={j} className="text-xs text-foreground flex items-center gap-2">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40"></span>
                              {alt.book.title} <span className="text-muted-foreground">({alt.score}%)</span>
                            </p>
                          ))}
                        </div>
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
