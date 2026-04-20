import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseExcelFile } from "@/lib/excelParser";
import { insertBooks } from "@/lib/bookService";
import { useToast } from "@/hooks/use-toast";

interface ExcelUploadProps {
  onUploadComplete: () => void;
}

export function ExcelUpload({ onUploadComplete }: ExcelUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const { toast } = useToast();

  const processFile = useCallback(async (file: File) => {
    setUploading(true);
    setResult(null);
    try {
      const books = await parseExcelFile(file);
      if (books.length === 0) {
        toast({ title: "No books found", description: "The file appears empty or has no valid data.", variant: "destructive" });
        return;
      }
      // Insert in batches of 100
      for (let i = 0; i < books.length; i += 100) {
        await insertBooks(books.slice(i, i + 100));
      }
      setResult({ count: books.length });
      toast({ title: "Upload complete", description: `${books.length} books imported successfully.` });
      onUploadComplete();
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [toast, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <FileSpreadsheet className="h-12 w-12 text-primary" />
          <p className="text-sm text-muted-foreground">Processing file...</p>
        </div>
      ) : result ? (
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Check className="h-6 w-6 text-accent" />
          </div>
          <p className="text-sm font-medium">{result.count} books imported</p>
          <Button variant="outline" size="sm" onClick={() => setResult(null)}>Upload another</Button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-3 cursor-pointer">
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Drop Excel/CSV file here</p>
            <p className="text-xs text-muted-foreground mt-1">Supports .xlsx, .xls, .csv</p>
          </div>
          <Button variant="outline" size="sm" disabled={uploading}>Browse Files</Button>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}
