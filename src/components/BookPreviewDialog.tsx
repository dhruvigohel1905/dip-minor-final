import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, User, Hash, MapPin, Layers } from 'lucide-react';

interface BookPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData: {
    title: string;
    author?: string;
    isbn?: string;
    shelf_number?: string;
    rack_number?: string;
  };
  onSave: (data: any) => void;
  isSaving: boolean;
}

export function BookPreviewDialog({ isOpen, onClose, extractedData, onSave, isSaving }: BookPreviewDialogProps) {
  const [formData, setFormData] = useState(extractedData || { title: '', author: '', isbn: '', shelf_number: '', rack_number: '' });

  useEffect(() => {
    if (extractedData) {
      setFormData(extractedData);
    }
  }, [extractedData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] glass-card border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-gradient">Review Book Details</DialogTitle>
          <DialogDescription>
            Verify and correct the information extracted from the image.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Card className="bg-primary/5 border-primary/10 overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-3 w-3" /> Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="bg-background/50 border-white/10 focus:ring-primary"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="author" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <User className="h-3 w-3" /> Author
                  </Label>
                  <Input
                    id="author"
                    name="author"
                    value={formData.author || ''}
                    onChange={handleChange}
                    className="bg-background/50 border-white/10 focus:ring-primary"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="isbn" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Hash className="h-3 w-3" /> ISBN
                  </Label>
                  <Input
                    id="isbn"
                    name="isbn"
                    value={formData.isbn || ''}
                    onChange={handleChange}
                    className="bg-background/50 border-white/10 focus:ring-primary"
                    placeholder="Enter ISBN if not detected"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="shelf_number" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Shelf
                    </Label>
                    <Input
                      id="shelf_number"
                      name="shelf_number"
                      value={formData.shelf_number || ''}
                      onChange={handleChange}
                      className="bg-background/50 border-white/10 focus:ring-primary"
                      placeholder="e.g. S1"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rack_number" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Layers className="h-3 w-3" /> Rack
                    </Label>
                    <Input
                      id="rack_number"
                      name="rack_number"
                      value={formData.rack_number || ''}
                      onChange={handleChange}
                      className="bg-background/50 border-white/10 focus:ring-primary"
                      placeholder="e.g. R4"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isSaving} className="hover:bg-white/10">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            {isSaving ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : 'Save to Library'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
