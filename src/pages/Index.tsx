import { useState, useEffect, useCallback } from "react";
import { BookOpen, ScanLine, Database, BarChart3, Aperture } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageCapture } from "@/components/ImageCapture";
import { ExcelUpload } from "@/components/ExcelUpload";
import { BookList } from "@/components/BookList";
import { ScanResults } from "@/components/ScanResults";
import { DashboardCharts } from "@/components/DashboardCharts";
import { fetchBooks, scanImage, matchBooks, deleteBook, type Book, type MatchResult } from "@/lib/bookService";
import { DIPAnalysis } from "@/components/DIPAnalysis";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const Index = ({ activeTab = "scan", onActiveTabChange }: { activeTab?: string; onActiveTabChange?: (tab: string) => void }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [scanResults, setScanResults] = useState<MatchResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadBooks = useCallback(async () => {
    try {
      const data = await fetchBooks();
      setBooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const handleImageCapture = useCallback(async (base64: string) => {
    setIsScanning(true);
    setScanResults([]);
    try {
      const extracted = await scanImage(base64);
      if (extracted.length === 0) {
        toast({ title: "No books detected", description: "Try a clearer image with visible book spines or covers.", variant: "destructive" });
        return;
      }
      const results = matchBooks(extracted, books);
      setScanResults(results);
      toast({ title: `${extracted.length} books detected`, description: `${results.filter(r => r.match).length} matched with library.` });
    } catch (err) {
      toast({ title: "Scan failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  }, [books, toast]);

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
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={onActiveTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-primary/10 border border-primary/20">
            <TabsTrigger 
              value="scan" 
              className="gap-2 font-display data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <ScanLine className="h-4 w-4" /> Scan
            </TabsTrigger>
            <TabsTrigger 
              value="library" 
              className="gap-2 font-display data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <BookOpen className="h-4 w-4" /> Library
            </TabsTrigger>
            <TabsTrigger 
              value="import" 
              className="gap-2 font-display data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4" /> Import
            </TabsTrigger>
            <TabsTrigger 
              value="dip" 
              className="gap-2 font-display data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <Aperture className="h-4 w-4" /> DIP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white rounded-xl p-6 space-y-4 shadow-sm border border-border">
                <div>
                  <h2 className="text-xl font-display font-semibold text-foreground">Scan Book Spines</h2>
                  <p className="text-sm text-muted-foreground">Take a photo or upload an image of book spines to identify them</p>
                </div>
                <ImageCapture onImageCapture={handleImageCapture} isProcessing={isScanning} />
                {isScanning && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20 animate-pulse">
                    <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-sm text-primary font-medium">Analyzing image with AI...</span>
                  </div>
                )}
              </div>
            </motion.div>

            {scanResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="bg-white rounded-xl p-6 space-y-4 shadow-sm border border-border">
                  <h2 className="text-xl font-display font-semibold text-foreground">Scan Results</h2>
                  <ScanResults results={scanResults} />
                </div>
              </motion.div>
            )}

            {books.length === 0 && !loading && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <p>No books in library yet. Import an Excel dataset first for better matching.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="library">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="space-y-6">
                {/* Dashboard Charts */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-border">
                  <h2 className="text-xl font-display font-semibold mb-4 text-foreground">Library Analytics</h2>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />)}
                    </div>
                  ) : (
                    <DashboardCharts books={books} />
                  )}
                </div>

                {/* Book List */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-border">
                  <h2 className="text-xl font-display font-semibold mb-4 text-foreground">Book List</h2>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
                    </div>
                  ) : (
                    <BookList books={books} onDelete={handleDelete} />
                  )}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="import">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white rounded-xl p-6 space-y-4 shadow-sm border border-border">
                <div>
                  <h2 className="text-xl font-display font-semibold text-foreground">Import Book Data</h2>
                  <p className="text-sm text-muted-foreground">Upload an Excel or CSV file with your book dataset</p>
                </div>
                <ExcelUpload onUploadComplete={loadBooks} />
                <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="font-medium">Expected columns:</p>
                  <p>Title (required), Author, ISBN, Genre, Publisher, Year</p>
                  <p>Additional columns will be stored as metadata.</p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="dip">
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
