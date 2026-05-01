import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Camera, FileImage, X, Search, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { scanImage } from '@/lib/bookService';
import { BookPreviewDialog } from './BookPreviewDialog';
import { supabase } from '@/integrations/supabase/client';

interface ImageImportProps {
  onSuccess?: () => void;
}

export function ImageImport({ onSuccess }: ImageImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessImage = async () => {
    if (!preview) return;

    setIsProcessing(true);
    try {
      // Use existing scanImage service but for a single book
      const results = await scanImage(preview);
      
      if (results && results.length > 0) {
        // Take the first result as it's a single book upload
        setExtractedData({
          title: results[0].title || 'Unknown Title',
          author: results[0].author || '',
          isbn: results[0].isbn || '',
        });
        setIsPreviewOpen(true);
      } else {
        // Fallback for manual entry if OCR fails
        setExtractedData({
          title: '',
          author: '',
          isbn: '',
        });
        setIsPreviewOpen(true);
        toast({
          title: "OCR Failed",
          description: "We couldn't extract data automatically. Please enter it manually.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("OCR Error:", error);
      toast({
        title: "Processing Error",
        description: "Failed to process image. You can still enter details manually.",
        variant: "destructive"
      });
      // Allow manual entry anyway
      setExtractedData({ title: '', author: '', isbn: '' });
      setIsPreviewOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveBook = async (data: any) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('books').insert([
        {
          title: data.title,
          author: data.author || null,
          isbn: data.isbn || null,
          shelf_number: data.shelf_number || null,
          rack_number: data.rack_number || null,
        }
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Book added to library successfully.",
      });
      
      setIsPreviewOpen(false);
      clearSelection();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-dashed border-2 border-primary/20 hover:border-primary/40 transition-all">
        <CardContent className="p-10">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            {!preview ? (
              <>
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold">Import via Book Image</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Upload a photo of the book cover. Our AI will automatically extract the title and author.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <FileImage className="h-4 w-4 mr-2" /> Select Image
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </>
            ) : (
              <div className="w-full space-y-6">
                <div className="relative max-w-sm mx-auto group">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="rounded-xl shadow-2xl border-4 border-white/10 w-full object-cover aspect-[3/4]" 
                  />
                  <button 
                    onClick={clearSelection}
                    className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex flex-col items-center space-y-3">
                  <Button 
                    onClick={handleProcessImage} 
                    disabled={isProcessing}
                    className="w-full max-w-xs bg-primary hover:bg-primary/90 text-white h-12 text-lg font-semibold shadow-xl shadow-primary/20"
                  >
                    {isProcessing ? (
                      <>
                        <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                        Analyzing Image...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-3" /> Extract Data with OCR
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG. Max 5MB.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Guide */}
      {!preview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: FileImage, title: "Upload Image", text: "Take a photo of book spine or cover" },
            { icon: Search, title: "AI Extraction", text: "OCR extracts title, author & ISBN" },
            { icon: CheckCircle2, title: "Review & Save", text: "Verify details and add to library" }
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <item.icon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <BookPreviewDialog 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        extractedData={extractedData}
        onSave={handleSaveBook}
        isSaving={isProcessing}
      />
    </div>
  );
}
