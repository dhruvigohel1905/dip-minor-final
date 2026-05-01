import { useState, useEffect, useCallback } from "react";
import { BookOpen, ScanLine, BarChart3, Aperture, Bell, Image as ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageCapture } from "@/components/ImageCapture";
import { ExcelUpload } from "@/components/ExcelUpload";
import { ImageImport } from "@/components/ImageImport";
import { BookList } from "@/components/BookList";
import { ScanResults } from "@/components/ScanResults";
import { ShelfVisualizer } from "@/components/ShelfVisualizer";
import { DashboardCharts } from "@/components/DashboardCharts";
import { ShelfHeatmap } from "@/components/ShelfHeatmap";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { fetchBooks, scanImage, matchBooks, deleteBook, type Book, type MatchResult } from "@/lib/bookService";
import { DIPAnalysis } from "@/components/DIPAnalysis";
import { useToast } from "@/hooks/use-toast";
import { useVoiceAlert } from "@/hooks/useVoiceAlert";
import { motion } from "framer-motion";
import { createScan, addScanItem, createAlert } from "@/services/scanService";
import { useAuth } from "@/hooks/useAuth";

const Index = ({ activeTab = "scan", onActiveTabChange }: { activeTab?: string; onActiveTabChange?: (tab: string) => void }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [scanResults, setScanResults] = useState<MatchResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentShelf, setCurrentShelf] = useState("S1");
  const { toast } = useToast();
  const { announceScanResults } = useVoiceAlert();
  const { user } = useAuth();

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchBooks();
      setBooks(data);
      setLoadError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load books from library";
      console.error("Books load error:", err);
      setLoadError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const handleImageCapture = useCallback(async (base64: string) => {
    if (!user) return;
    setIsScanning(true);
    setScanResults([]);
    try {
      const extracted = await scanImage(base64);
      if (extracted.length === 0) {
        toast({ title: "No books detected", description: "Try a clearer image with visible book spines or covers.", variant: "destructive" });
        return;
      }
      
      const results = matchBooks(extracted, books, currentShelf);
      setScanResults(results);
      
      const matchedCount = results.filter(r => r.match && !r.isMisplaced).length;
      const misplacedCount = results.filter(r => r.isMisplaced).length;
      const unmatchedCount = results.filter(r => !r.match).length;

      // Log the scan results
      const scan = await createScan(user.id, currentShelf, extracted.length, base64);
      
      for (const res of results) {
        await addScanItem(
          scan.id,
          res.match?.id || null,
          res.extracted.title,
          res.extracted.author,
          res.confidence,
          undefined,
          !!res.match
        );

        if (res.isMisplaced) {
          await createAlert(
            'misplaced',
            res.match?.id || null,
            scan.id,
            res.expectedShelf || null,
            currentShelf,
            `Misplaced Book: "${res.match?.title}" found on Shelf ${currentShelf} instead of Shelf ${res.expectedShelf}`
          );
        }
      }

      toast({ 
        title: "Scan Complete", 
        description: `${extracted.length} books detected. ${matchedCount} correct, ${misplacedCount} misplaced, ${unmatchedCount} unmatched.` 
      });
      
      announceScanResults(extracted.length, matchedCount);
    } catch (err) {
      toast({ title: "Scan failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  }, [books, toast, announceScanResults, currentShelf, user]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteBook(id);
      setBooks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={onActiveTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-12 glass border-white/10 p-1">
            <TabsTrigger value="scan" className="gap-1.5 font-display text-[10px] uppercase font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
              <ScanLine className="h-4 w-4" /> Scan
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-1.5 font-display text-[10px] uppercase font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
              <BookOpen className="h-4 w-4" /> Library
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-1.5 font-display text-[10px] uppercase font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" /> Import
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1.5 font-display text-[10px] uppercase font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
              <Bell className="h-4 w-4" /> Alerts
            </TabsTrigger>
            <TabsTrigger value="dip" className="gap-1.5 font-display text-[10px] uppercase font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-white">
              <Aperture className="h-4 w-4" /> DIP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-6 outline-none">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass-card rounded-2xl p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">Shelf Scanner</h2>
                    <p className="text-sm text-muted-foreground">Identify misplaced and missing books using Computer Vision</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Current Shelf:</span>
                    <select 
                      value={currentShelf} 
                      onChange={(e) => setCurrentShelf(e.target.value)}
                      className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer"
                    >
                      {["S1", "S2", "S3", "S4", "S5"].map(s => <option key={s} value={s}>Shelf {s}</option>)}
                    </select>
                  </div>
                </div>
                
                <ImageCapture onImageCapture={handleImageCapture} isProcessing={isScanning} />
              </div>
            </motion.div>

            {scanResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <ShelfVisualizer results={scanResults} shelfNumber={currentShelf} />
                <div className="glass-card rounded-2xl p-8">
                  <h2 className="text-xl font-display font-bold text-foreground mb-6">Detailed Scan Results</h2>
                  <ScanResults results={scanResults} />
                </div>
              </motion.div>
            )}
          </TabsContent>



          <TabsContent value="library" className="outline-none">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardCharts books={books} />
                <ShelfHeatmap books={books} />
              </div>
              <BookList books={books} onDelete={handleDelete} />
            </motion.div>
          </TabsContent>

          <TabsContent value="import" className="outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
                <ImageImport onSuccess={loadBooks} />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
                <ExcelUpload onUploadComplete={loadBooks} />
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="outline-none">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <NotificationCenter />
            </motion.div>
          </TabsContent>

          <TabsContent value="dip" className="outline-none">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <DIPAnalysis />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
