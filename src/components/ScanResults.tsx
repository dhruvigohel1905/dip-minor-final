import { type MatchResult } from "@/lib/bookService";
import { Check, AlertTriangle, X, ChevronDown, BookOpen, Layers, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScanResultsProps {
  results: MatchResult[];
}

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 80) return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 uppercase tracking-tight"><Check className="h-3 w-3" />{score}% Match</span>;
  if (score >= 50) return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-500 uppercase tracking-tight"><AlertTriangle className="h-3 w-3" />{score}% Match</span>;
  if (score > 0) return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 uppercase tracking-tight"><AlertTriangle className="h-3 w-3" />{score}% Match</span>;
  return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-tight"><X className="h-3 w-3" />No match</span>;
}

export function ScanResults({ results }: ScanResultsProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (results.length === 0) return null;

  const matched = results.filter((r) => r.match && !r.isMisplaced).length;
  const misplaced = results.filter((r) => r.isMisplaced).length;
  const unmatched = results.filter((r) => !r.match).length;
  const total = results.length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Detected", value: total, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Correctly Placed", value: matched, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Misplaced Books", value: misplaced, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Not in Library", value: unmatched, icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-500/10" }
        ].map((stat, i) => (
          <Card key={i} className="glass-card border-white/5 overflow-hidden group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4" /> Detailed Results
        </h3>
        
        {results.map((result, i) => {
          const isCorrect = result.match && !result.isMisplaced;
          const isMisplaced = result.isMisplaced;
          const isNoMatch = !result.match;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "rounded-xl overflow-hidden border transition-all",
                isCorrect ? "bg-green-500/5 border-green-500/10" : 
                isMisplaced ? "bg-red-500/5 border-red-500/10" : 
                "bg-yellow-500/5 border-yellow-500/10"
              )}
            >
              <button
                className="w-full p-4 flex items-start justify-between gap-4 text-left hover:bg-white/5 transition-colors"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex-1 min-w-0 flex gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner",
                    isCorrect ? "bg-green-500/20 text-green-500" : 
                    isMisplaced ? "bg-red-500/20 text-red-500" : 
                    "bg-yellow-500/20 text-yellow-500"
                  )}>
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ConfidenceBadge score={result.confidence} />
                      {isMisplaced && <Badge variant="destructive" className="h-5 px-2 text-[8px] font-bold uppercase">Misplaced</Badge>}
                      <span className="text-[10px] text-muted-foreground font-medium italic">OCR: "{result.extracted.title}"</span>
                    </div>
                    {result.match ? (
                      <div>
                        <p className="font-bold text-foreground truncate">{result.match.title}</p>
                        <p className="text-xs text-muted-foreground">{result.match.author || "Unknown author"}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No library match found</p>
                    )}
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 mt-2 ${expanded === i ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {expanded === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-2 space-y-4">
                      {isMisplaced && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Expected on <span className="font-bold">Shelf {result.expectedShelf}</span>, but found here.
                        </div>
                      )}
                      
                      {result.match && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground block mb-1">Genre</span>
                            <span className="font-bold">{result.match.genre || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-1">Publisher</span>
                            <span className="font-bold">{result.match.publisher || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-1">ISBN</span>
                            <span className="font-bold">{result.match.isbn || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-1">Year</span>
                            <span className="font-bold">{result.match.year || "N/A"}</span>
                          </div>
                        </div>
                      )}

                      {result.alternativeMatches.length > 0 && (
                        <div className="space-y-2 border-t border-white/5 pt-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Alternative Matches</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {result.alternativeMatches.map((alt, j) => (
                              <div key={j} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-[10px]">
                                <span className="truncate pr-2 font-medium">{alt.book.title}</span>
                                <Badge variant="outline" className="h-4 px-1 text-[8px] opacity-70">{alt.score}%</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
