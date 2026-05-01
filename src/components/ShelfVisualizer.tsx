import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, HelpCircle, Book as BookIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MatchResult } from '@/lib/bookService';

interface ShelfVisualizerProps {
  results: MatchResult[];
  shelfNumber: string;
}

export function ShelfVisualizer({ results, shelfNumber }: ShelfVisualizerProps) {
  return (
    <Card className="glass-card border-white/10 overflow-hidden">
      <div className="bg-primary/5 p-4 border-b border-white/10 flex justify-between items-center">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <BookIcon className="h-5 w-5 text-primary" />
          Shelf {shelfNumber} Layout
        </h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
            <div className="h-2 w-2 rounded-full bg-green-500" /> Correct
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
            <div className="h-2 w-2 rounded-full bg-red-500" /> Misplaced
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
            <div className="h-2 w-2 rounded-full bg-yellow-500" /> Unmatched
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {results.map((res, i) => {
            const isCorrect = res.match && !res.isMisplaced;
            const isMisplaced = res.isMisplaced;
            const isNoMatch = !res.match;

            return (
              <div 
                key={i} 
                className={cn(
                  "relative group h-40 rounded-xl border-2 transition-all duration-300 p-3 flex flex-col justify-between overflow-hidden",
                  isCorrect && "bg-green-500/5 border-green-500/20 hover:border-green-500/40",
                  isMisplaced && "bg-red-500/5 border-red-500/20 hover:border-red-500/40",
                  isNoMatch && "bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40"
                )}
              >
                {/* Status Indicator */}
                <div className="absolute top-2 right-2">
                  {isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {isMisplaced && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {isNoMatch && <HelpCircle className="h-4 w-4 text-yellow-500" />}
                </div>

                {/* Book Info */}
                <div className="space-y-1">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center mb-2">
                    <BookIcon className={cn(
                      "h-4 w-4",
                      isCorrect && "text-green-500",
                      isMisplaced && "text-red-500",
                      isNoMatch && "text-yellow-500"
                    )} />
                  </div>
                  <p className="text-[10px] font-bold line-clamp-2 leading-tight">
                    {res.extracted.title || 'Unknown Title'}
                  </p>
                  <p className="text-[8px] text-muted-foreground line-clamp-1">
                    {res.extracted.author || 'Unknown Author'}
                  </p>
                </div>

                {/* Footer labels */}
                <div className="pt-2">
                  {isMisplaced && (
                    <Badge variant="destructive" className="text-[8px] h-4 px-1.5 font-bold">
                      Expected: {res.expectedShelf}
                    </Badge>
                  )}
                  {isCorrect && (
                    <Badge className="bg-green-500 text-white text-[8px] h-4 px-1.5 font-bold">
                      Correct Position
                    </Badge>
                  )}
                  {isNoMatch && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600/30 text-[8px] h-4 px-1.5 font-bold">
                      Not in Library
                    </Badge>
                  )}
                </div>

                {/* Slot index */}
                <span className="absolute bottom-1 right-2 text-[10px] font-mono opacity-20 group-hover:opacity-100 transition-opacity">
                  #{i + 1}
                </span>
              </div>
            );
          })}
          
          {/* Missing Slot Mockup */}
          <div className="h-40 rounded-xl border-2 border-dashed border-white/5 bg-black/5 flex flex-col items-center justify-center text-center p-4">
             <AlertCircle className="h-6 w-6 text-muted-foreground/30 mb-2" />
             <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Missing Slot</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
