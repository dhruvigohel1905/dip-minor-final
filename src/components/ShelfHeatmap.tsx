/**
 * ShelfHeatmap — Genre × Publication Year heatmap.
 * Reads the existing books array (no extra DB calls).
 * Color intensity = number of books in that Genre+Year cell.
 */

import { useMemo, useState } from "react";
import { type Book } from "@/lib/bookService";
import { Info } from "lucide-react";

interface ShelfHeatmapProps {
  books: Book[];
}

// Color palette: 0 = pale, 5 = deep — matches the app's purple primary
const HEAT_COLORS = [
  "#f3e8ff", // 0 — near empty
  "#d8b4fe", // 1
  "#a855f7", // 2-3
  "#7c3aed", // 4-6
  "#5b21b6", // 7-10
  "#3b0764", // 11+
];

function heatColor(count: number): string {
  if (count === 0) return HEAT_COLORS[0];
  if (count === 1) return HEAT_COLORS[1];
  if (count <= 3) return HEAT_COLORS[2];
  if (count <= 6) return HEAT_COLORS[3];
  if (count <= 10) return HEAT_COLORS[4];
  return HEAT_COLORS[5];
}

function textColor(count: number): string {
  return count <= 3 ? "#4b5563" : "#ffffff";
}

interface TooltipInfo {
  genre: string;
  year: string;
  count: number;
  titles: string[];
  x: number;
  y: number;
}

export function ShelfHeatmap({ books }: ShelfHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const { genres, years, matrix } = useMemo(() => {
    // Build genre × year matrix
    const map: Record<string, Record<string, Book[]>> = {};

    books.forEach((book) => {
      const genre = book.genre?.trim() || "Unknown";
      const year = book.year ? String(book.year) : "N/A";

      if (!map[genre]) map[genre] = {};
      if (!map[genre][year]) map[genre][year] = [];
      map[genre][year].push(book);
    });

    // Sort genres by total count desc
    const genres = Object.keys(map).sort((a, b) => {
      const totalA = Object.values(map[a]).reduce((s, arr) => s + arr.length, 0);
      const totalB = Object.values(map[b]).reduce((s, arr) => s + arr.length, 0);
      return totalB - totalA;
    });

    // Sort years ascending, put "N/A" at end
    const allYears = Array.from(
      new Set(books.map((b) => (b.year ? String(b.year) : "N/A")))
    ).sort((a, b) => {
      if (a === "N/A") return 1;
      if (b === "N/A") return -1;
      return Number(a) - Number(b);
    });

    // Matrix: matrix[genre][year] = Book[]
    const matrix: Record<string, Record<string, Book[]>> = {};
    genres.forEach((g) => {
      matrix[g] = {};
      allYears.forEach((y) => {
        matrix[g][y] = map[g]?.[y] ?? [];
      });
    });

    return { genres, years: allYears, matrix };
  }, [books]);

  if (books.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No books imported yet. Import data to see the shelf heatmap.
      </div>
    );
  }

  const maxCount = Math.max(
    1,
    ...genres.flatMap((g) => years.map((y) => matrix[g][y]?.length ?? 0))
  );

  return (
    <div className="space-y-6">
      {/* Information Card - How it helps */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex gap-6 items-start">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Info className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-primary uppercase tracking-widest">Why this Heatmap helps?</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Collection Insights:</strong> Instantly see which genres and publication years dominate your library, helping you balance the collection.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Gap Detection:</strong> Identify "white spaces" where you might be missing important historical editions or entire categories.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Space Planning:</strong> Dense cells indicate high-traffic shelf areas that may require more frequent maintenance or additional shelving.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Librarian Efficiency:</strong> Quickly locate clusters of related books (by era and genre) without manual searching.
            </p>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          Hover a cell to see book titles
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-muted-foreground mr-1">Fewer</span>
          {HEAT_COLORS.map((c, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-sm border border-black/5"
              style={{ backgroundColor: c }}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <div className="min-w-max">
          {/* Header row — Years */}
          <div className="flex">
            <div className="w-40 flex-shrink-0 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-r border-border sticky left-0 z-20">
              Genre ↓ / Year →
            </div>
            {years.map((year) => (
              <div
                key={year}
                className="w-20 flex-shrink-0 px-1 py-3 text-center text-xs font-bold text-muted-foreground bg-muted/40 border-b border-r border-border last:border-r-0"
              >
                {year}
              </div>
            ))}
          </div>

          {/* Data rows — Genres */}
          {genres.map((genre) => {
            const rowTotal = years.reduce(
              (sum, y) => sum + (matrix[genre][y]?.length ?? 0),
              0
            );
            return (
              <div key={genre} className="flex group">
                {/* Genre label - Sticky */}
                <div className="w-40 flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-r border-border bg-background sticky left-0 z-20 group-last:border-b-0">
                  <span
                    className="text-xs font-bold text-foreground truncate max-w-[100px]"
                    title={genre}
                  >
                    {genre}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {rowTotal}
                  </span>
                </div>

                {/* Cells */}
                {years.map((year) => {
                  const cell = matrix[genre][year] ?? [];
                  const count = cell.length;

                  return (
                    <div
                      key={year}
                      className="w-20 flex-shrink-0 h-14 flex items-center justify-center text-xs font-bold border-b border-r border-border/40 cursor-pointer transition-all hover:scale-105 hover:z-10 hover:shadow-2xl hover:rounded-sm group-last:border-b-0 last:border-r-0"
                      style={{
                        backgroundColor: heatColor(count),
                        color: textColor(count),
                      }}
                      onMouseEnter={(e) => {
                        if (count === 0) return;
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setTooltip({
                          genre,
                          year,
                          count,
                          titles: cell.slice(0, 5).map((b) => b.title),
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Max note */}
      <p className="text-xs text-muted-foreground text-right">
        Peak: <span className="font-semibold text-foreground">{maxCount}</span> books in a single cell
      </p>

      {/* Floating Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-border px-4 py-3 min-w-[200px] max-w-xs pointer-events-none"
          style={{
            left: Math.min(tooltip.x, window.innerWidth - 230),
            top: tooltip.y - 10,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: heatColor(tooltip.count) }}
            />
            <span className="text-xs font-semibold text-foreground">
              {tooltip.genre} · {tooltip.year}
            </span>
          </div>
          <p className="text-xs text-primary font-bold mb-1.5">
            {tooltip.count} book{tooltip.count !== 1 ? "s" : ""}
          </p>
          <div className="space-y-0.5">
            {tooltip.titles.map((t, i) => (
              <p key={i} className="text-xs text-muted-foreground truncate">
                · {t}
              </p>
            ))}
            {tooltip.count > 5 && (
              <p className="text-xs text-muted-foreground italic">
                + {tooltip.count - 5} more…
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
