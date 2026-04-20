
-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  genre TEXT,
  publisher TEXT,
  year INTEGER,
  additional_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast text search
CREATE INDEX idx_books_title ON public.books USING gin(to_tsvector('english', title));
CREATE INDEX idx_books_isbn ON public.books (isbn);
CREATE INDEX idx_books_author ON public.books USING gin(to_tsvector('english', COALESCE(author, '')));

-- Create scan_results table for storing OCR scan history
CREATE TABLE public.scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  extracted_text TEXT,
  matched_book_id UUID REFERENCES public.books(id),
  confidence_score NUMERIC,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;

-- Public read access for books (library data is public)
CREATE POLICY "Anyone can view books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Anyone can insert books" ON public.books FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update books" ON public.books FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete books" ON public.books FOR DELETE USING (true);

-- Public access for scan results
CREATE POLICY "Anyone can view scan results" ON public.scan_results FOR SELECT USING (true);
CREATE POLICY "Anyone can insert scan results" ON public.scan_results FOR INSERT WITH CHECK (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
