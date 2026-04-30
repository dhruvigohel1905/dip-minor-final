# Smart Library System - Development Roadmap

## Overview

This document provides a detailed roadmap for implementing the remaining 8 features. Each feature includes:
- Detailed description
- Files to create/modify
- Code examples
- Integration steps
- Testing guidelines

---

## Roadmap Summary

| Feature | Priority | Complexity | Est. Time | Status |
|---------|----------|-----------|-----------|--------|
| Excel Dataset Enhancement | High | Low | 2-3 hrs | Ready |
| Camera Capture | High | Medium | 3-4 hrs | Ready |
| Book OCR Upload | High | Medium | 4-5 hrs | Ready |
| Scan History Module | Medium | Low | 2-3 hrs | Ready |
| Email Notifications | High | Medium | 3-4 hrs | Ready |
| Analytics & Charts | Medium | Medium | 4-5 hrs | Ready |
| PDF Reports | Medium | Medium | 3-4 hrs | Ready |
| Manual Book Correction | Low | Low | 2-3 hrs | Ready |

**Total Estimated Time**: 24-31 hours (distributed across 5 team members)

---

## Feature 1: Excel Dataset Enhancement with Shelf Support

### Overview
Enhance the existing Excel import to support shelf numbers and rack numbers for better book organization.

### Files to Create/Modify
- **Modify**: `src/lib/excelParser.ts`
- **Modify**: `src/components/ExcelUpload.tsx`
- **New**: `src/components/books/ExcelImportPreview.tsx`

### Implementation Steps

#### Step 1: Update Excel Parser
```typescript
// src/lib/excelParser.ts - Add to FIELD_MAPPINGS

const FIELD_MAPPINGS: Record<string, string[]> = {
  // ... existing mappings ...
  shelf_number: ["shelf", "shelf number", "shelf_number", "shelf no"],
  rack_number: ["rack", "rack number", "rack_number", "rack no"],
};
```

#### Step 2: Update ParsedBook Type
```typescript
// src/lib/excelParser.ts

interface ParsedBook {
  title: string;
  author: string | null;
  isbn: string | null;
  genre: string | null;
  publisher: string | null;
  year: number | null;
  shelf_number: string | null;      // NEW
  rack_number: string | null;        // NEW
  additional_metadata: Record<string, unknown>;
}
```

#### Step 3: Create Shelf Validation
```typescript
// src/lib/validators.ts (NEW)

export function validateShelfNumber(shelf: string): boolean {
  // Example: A1, B2, C3 format
  return /^[A-Z]\d+$/.test(shelf);
}

export function validateRackNumber(rack: string): boolean {
  return /^\d+$/.test(rack);
}
```

#### Step 4: Update ExcelUpload Component
```typescript
// src/components/ExcelUpload.tsx

// Add shelf validation and preview
const [validateShelves, setValidateShelves] = useState(false);
const [invalidRows, setInvalidRows] = useState<number[]>([]);

// Validate shelf numbers before upload
const validateBooks = (books: ParsedBook[]) => {
  const invalid = books
    .map((b, i) => !validateShelfNumber(b.shelf_number) ? i : -1)
    .filter(i => i !== -1);
  
  setInvalidRows(invalid);
  return invalid.length === 0;
};
```

### Testing
```typescript
// Test with sample Excel files
- Valid: Books with proper shelf numbers
- Invalid: Missing shelf numbers
- Edge cases: Empty cells, special characters
```

### Integration
1. Users click "Upload Dataset"
2. Select Excel file
3. System validates shelf numbers
4. Show preview with validation errors
5. User corrects issues
6. Confirm upload
7. Books saved with shelf information

---

## Feature 2: Camera Capture Support

### Overview
Allow librarians to capture shelf images directly from webcam instead of uploading files.

### Files to Create/Modify
- **Modify**: `src/components/ImageCapture.tsx` (enhance existing)
- **New**: `src/components/scanner/CameraCapture.tsx`
- **New**: `src/hooks/useCamera.ts`

### Implementation Steps

#### Step 1: Create Camera Hook
```typescript
// src/hooks/useCamera.ts

export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async (facingMode: 'user' | 'environment' = 'environment') => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera access denied');
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
  };

  const captureFrame = (): string => {
    if (!videoRef.current) throw new Error('Video not ready');
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg');
  };

  return { videoRef, stream, error, startCamera, stopCamera, captureFrame };
};
```

#### Step 2: Create Camera Component
```typescript
// src/components/scanner/CameraCapture.tsx

export const CameraCapture = ({ onCapture }: { onCapture: (image: string) => void }) => {
  const { videoRef, stream, error, startCamera, stopCamera, captureFrame } = useCamera();
  const [cameraActive, setCameraActive] = useState(false);

  const handleCapture = () => {
    try {
      const image = captureFrame();
      onCapture(image);
      // Optional: Show preview
    } catch (err) {
      toast({ title: 'Capture failed', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Camera Capture</CardTitle>
      </CardHeader>
      <CardContent>
        {!cameraActive ? (
          <Button onClick={() => { startCamera(); setCameraActive(true); }}>
            Start Camera
          </Button>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCapture}>Capture</Button>
              <Button variant="outline" onClick={() => { stopCamera(); setCameraActive(false); }}>
                Stop
              </Button>
            </div>
          </>
        )}
        {error && <p className="text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
};
```

### Testing
- Test on different devices
- Check camera permissions
- Verify image quality
- Test with different lighting conditions

### Integration
1. Add camera button to scanning interface
2. Handle different device cameras (front/back)
3. Show camera preview
4. Capture and process image
5. Integrate with existing scan flow

---

## Feature 3: Book Upload with OCR and Preview

### Overview
Allow librarians to upload book cover images, extract details via OCR, and save as new books.

### Files to Create/Modify
- **New**: `src/components/books/BookUploadForm.tsx`
- **New**: `src/components/books/BookOCRPreview.tsx`
- **New**: `src/services/bookService.ts` (enhance)

### Implementation Steps

#### Step 1: Create Book Upload Form
```typescript
// src/components/books/BookUploadForm.tsx

export const BookUploadForm = () => {
  const [image, setImage] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      
      // Call OCR
      setExtracting(true);
      try {
        const result = await extractBookInfo(base64);
        setExtracted(result);
      } catch (error) {
        toast({ title: 'OCR failed', variant: 'destructive' });
      } finally {
        setExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Book</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
          type="file" 
          accept="image/*"
          onChange={handleImageUpload}
        />
        {image && <img src={image} alt="Book cover" className="max-w-xs" />}
        {extracting && <p>Extracting book information...</p>}
        {extracted && <BookOCRPreview data={extracted} />}
      </CardContent>
    </Card>
  );
};
```

#### Step 2: Create OCR Preview Component
```typescript
// src/components/books/BookOCRPreview.tsx

export const BookOCRPreview = ({ data }: { data: any }) => {
  const form = useForm({
    defaultValues: {
      title: data.title || '',
      author: data.author || '',
      isbn: data.isbn || '',
      genre: data.genre || '',
      shelf_number: '',
      confidence: data.confidence || 0,
    }
  });

  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title (confidence: {data.confidence}%)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        {/* Similar fields for author, isbn, genre, shelf_number */}
        <Button>Save Book</Button>
      </form>
    </Form>
  );
};
```

#### Step 3: Create Extract Function
```typescript
// In src/services/bookService.ts

export async function extractBookInfo(imageBase64: string) {
  const { data, error } = await supabase.functions.invoke('ocr-scan', {
    body: { imageBase64 },
  });
  
  if (error) throw error;
  
  return {
    title: data.books?.[0]?.title || '',
    author: data.books?.[0]?.author || '',
    isbn: data.books?.[0]?.isbn || '',
    confidence: data.books?.[0]?.confidence || 0,
  };
}

export async function saveUploadedBook(
  userId: string,
  bookData: any,
  imageUrl: string
) {
  const { data, error } = await supabase
    .from('uploaded_books')
    .insert([{
      user_id: userId,
      image_url: imageUrl,
      extracted_title: bookData.title,
      extracted_author: bookData.author,
      ocr_confidence: bookData.confidence,
      status: 'pending',
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Testing
- Test with book covers
- Verify OCR accuracy
- Test form validation
- Verify database storage

---

## Feature 4: Scan History Module

### Overview
Display detailed history of all scans with filters, search, and export capabilities.

### Files to Create/Modify
- **New**: `src/pages/ScanHistory.tsx`
- **New**: `src/components/scanner/ScanHistoryTable.tsx`
- **New**: `src/hooks/useScanHistory.ts`

### Implementation Steps

#### Step 1: Create Scan History Hook
```typescript
// src/hooks/useScanHistory.ts

export const useScanHistory = () => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    shelf: '',
    dateFrom: null,
    dateTo: null,
    sortBy: 'date_desc'
  });

  const loadScans = useCallback(async () => {
    try {
      let query = supabase.from('scans').select('*');
      
      if (filters.shelf) {
        query = query.eq('shelf_scanned', filters.shelf);
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setScans(data || []);
    } catch (error) {
      console.error('Failed to load scans:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  return { scans, loading, filters, setFilters };
};
```

#### Step 2: Create Scan History Table
```typescript
// src/components/scanner/ScanHistoryTable.tsx

export const ScanHistoryTable = () => {
  const { scans, loading, filters, setFilters } = useScanHistory();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <Input 
              placeholder="Filter by shelf..."
              onChange={(e) => setFilters({ ...filters, shelf: e.target.value })}
            />
            {/* Date range pickers */}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shelf</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Books Found</TableHead>
                <TableHead>Missing</TableHead>
                <TableHead>Misplaced</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.map(scan => (
                <TableRow key={scan.id}>
                  <TableCell>{scan.shelf_scanned}</TableCell>
                  <TableCell>{new Date(scan.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{scan.total_books_found}</TableCell>
                  <TableCell className="text-red-600">{scan.missing_books_count}</TableCell>
                  <TableCell className="text-yellow-600">{scan.misplaced_books_count}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
```

#### Step 3: Create Scan History Page
```typescript
// src/pages/ScanHistory.tsx

export const ScanHistoryPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Scan History</h1>
        <p className="text-muted-foreground">View and manage all library scans</p>
      </div>
      <ScanHistoryTable />
    </div>
  );
};
```

### Integration
1. Add "Scan History" menu item to sidebar
2. Route to `/scan-history` page
3. Add filters for shelf, date range
4. Show detailed scan information
5. Export scan data

---

## Feature 5: Email Notifications

### Overview
Send email notifications to librarians when alerts are created.

### Files to Create/Modify
- **New**: `supabase/functions/send-email/index.ts`
- **Modify**: `src/services/notificationService.ts`

### Implementation Steps

#### Step 1: Create Supabase Function
```typescript
// supabase/functions/send-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

serve(async (req) => {
  const { to, subject, body, html } = await req.json()

  const client = new SmtpClient({
    connection: {
      hostname: Deno.env.get("SMTP_HOST"),
      port: parseInt(Deno.env.get("SMTP_PORT")),
      tls: true,
      auth: {
        username: Deno.env.get("SMTP_USER"),
        password: Deno.env.get("SMTP_PASSWORD"),
      },
    },
  })

  await client.connect()
  await client.send({
    from: Deno.env.get("SMTP_FROM"),
    to: to,
    subject: subject,
    content: body,
    html: html,
  })
  await client.close()

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } },
  )
})
```

#### Step 2: Configure Email Service
```env
# .env.local or Supabase secrets
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@library.com
```

#### Step 3: Update Notification Service
```typescript
// In src/services/notificationService.ts

export async function sendAlertEmail(
  userEmail: string,
  alertData: Alert
) {
  const htmlTemplate = `
    <h2>${alertData.alert_type.toUpperCase()} ALERT</h2>
    <p>${alertData.message}</p>
    <p>Expected Shelf: ${alertData.expected_shelf}</p>
    <p>Time: ${new Date(alertData.created_at).toLocaleString()}</p>
  `;

  await sendEmailNotification({
    to: userEmail,
    subject: `[Library Alert] ${alertData.alert_type}`,
    body: alertData.message || 'An alert has been triggered',
    html: htmlTemplate,
  });
}
```

### Testing
- Mock email sending in development
- Use SendGrid/Mailgun for testing
- Verify email content
- Test with multiple recipients

---

## Feature 6: Analytics & Charts

### Overview
Display analytics charts showing book issues, trends, and statistics.

### Files to Create/Modify
- **New**: `src/pages/Analytics.tsx`
- **New**: `src/components/analytics/AnalyticsCharts.tsx`
- **New**: `src/services/analyticsService.ts`

### Implementation Steps

#### Step 1: Create Analytics Service
```typescript
// src/services/analyticsService.ts

export async function getMisplacedBooksData() {
  const { data, error } = await supabase
    .from('alerts')
    .select('book_id, COUNT(*)')
    .eq('alert_type', 'misplaced')
    .eq('is_resolved', false)
    .group_by('book_id');

  if (error) throw error;
  return data;
}

export async function getShelfIssueStats() {
  const { data, error } = await supabase
    .from('alerts')
    .select('expected_shelf, alert_type, COUNT(*)')
    .group_by('expected_shelf, alert_type');

  if (error) throw error;
  return data;
}

export async function getWeeklyScanStats() {
  const { data, error } = await supabase
    .from('scans')
    .select('DATE_TRUNC(\'week\', created_at), COUNT(*)')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .group_by('DATE_TRUNC(\'week\', created_at)');

  if (error) throw error;
  return data;
}
```

#### Step 2: Create Charts Component
```typescript
// src/components/analytics/AnalyticsCharts.tsx

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const AnalyticsCharts = () => {
  const [misplacedData, setMisplacedData] = useState([]);
  const [shelfData, setShelfData] = useState([]);
  const [scanTrends, setScanTrends] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [misplaced, shelf, trends] = await Promise.all([
          getMisplacedBooksData(),
          getShelfIssueStats(),
          getWeeklyScanStats(),
        ]);
        setMisplacedData(misplaced);
        setShelfData(shelf);
        setScanTrends(trends);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    };

    loadData();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Most Misplaced Books</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart width={400} height={300} data={misplacedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#ef4444" />
          </BarChart>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scan Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart width={400} height={300} data={scanTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" />
          </LineChart>
        </CardContent>
      </Card>

      {/* More charts... */}
    </div>
  );
};
```

#### Step 3: Create Analytics Page
```typescript
// src/pages/Analytics.tsx

export const AnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Library performance and statistics</p>
      </div>
      <AnalyticsCharts />
    </div>
  );
};
```

### Testing
- Verify data aggregation
- Check chart rendering
- Test with different data sets
- Verify performance with large datasets

---

## Feature 7: PDF Report Generation

### Overview
Generate downloadable PDF reports with scan summaries, alerts, and statistics.

### Files to Create/Modify
- **New**: `src/pages/Reports.tsx`
- **New**: `src/components/reports/ReportGenerator.tsx`
- **New**: `src/services/reportService.ts`

### Implementation Steps

#### Step 1: Create Report Service
```typescript
// src/services/reportService.ts

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDFReport(
  title: string,
  htmlContent: string,
  filename: string
) {
  // Convert HTML to canvas
  const canvas = await html2canvas(document.getElementById('report-content') || document.body);
  
  // Create PDF
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 0;
  
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= 297; // A4 height
  
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297;
  }
  
  pdf.save(filename);
}

export async function generateScanReport(
  scanId: string,
  format: 'daily' | 'weekly' | 'summary'
) {
  const scan = await getScanWithDetails(scanId);
  
  // Build HTML report
  const html = `
    <div id="report-content" class="p-8 bg-white">
      <h1>${format.toUpperCase()} SCAN REPORT</h1>
      <p>Shelf: ${scan.shelf_scanned}</p>
      <p>Date: ${new Date(scan.timestamp).toLocaleDateString()}</p>
      
      <h2>Summary</h2>
      <ul>
        <li>Total Books: ${scan.total_books_found}</li>
        <li>Missing: ${scan.missing_books_count}</li>
        <li>Misplaced: ${scan.misplaced_books_count}</li>
      </ul>
      
      <h2>Details</h2>
      <table>
        <tr><th>Title</th><th>Author</th><th>Status</th></tr>
        ${scan.items?.map(item => `
          <tr>
            <td>${item.detected_title}</td>
            <td>${item.detected_author}</td>
            <td>${item.is_match ? 'Found' : 'Not Found'}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
  
  return html;
}
```

#### Step 2: Create Report Generator Component
```typescript
// src/components/reports/ReportGenerator.tsx

export const ReportGenerator = () => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'summary'>('daily');
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const content = await generateScanReport('scan-id', reportType);
      document.getElementById('report-content')!.innerHTML = content;
      
      await generatePDFReport(
        `${reportType.toUpperCase()} Report`,
        content,
        `library-report-${Date.now()}.pdf`
      );
      
      toast({ title: 'Report generated successfully' });
    } catch (error) {
      toast({ title: 'Failed to generate report', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily Report</SelectItem>
            <SelectItem value="weekly">Weekly Report</SelectItem>
            <SelectItem value="summary">Summary Report</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleGenerateReport}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate & Download'}
        </Button>
      </CardContent>
    </Card>
  );
};
```

### Testing
- Generate test reports
- Verify PDF output
- Check data accuracy
- Test with various date ranges

---

## Feature 8: Manual Book Correction

### Overview
Allow librarians to manually update book locations and metadata when corrections are needed.

### Files to Create/Modify
- **New**: `src/components/books/ManualBookCorrection.tsx`
- **Modify**: `src/services/bookService.ts`

### Implementation Steps

#### Step 1: Create Book Correction Component
```typescript
// src/components/books/ManualBookCorrection.tsx

export const ManualBookCorrection = ({ bookId }: { bookId: string }) => {
  const [book, setBook] = useState<Book | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [updating, setUpdating] = useState(false);

  const form = useForm({
    defaultValues: {
      shelf_number: '',
      rack_number: '',
      notes: '',
    }
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const bookData = await getBook(bookId);
        setBook(bookData);
        form.setValue('shelf_number', bookData.shelf_number || '');
        
        const shelfList = await getShelves();
        setShelves(shelfList);
      } catch (error) {
        toast({ title: 'Failed to load data', variant: 'destructive' });
      }
    };

    loadData();
  }, [bookId]);

  const onSubmit = async (data: any) => {
    setUpdating(true);
    try {
      await updateBook(bookId, {
        shelf_number: data.shelf_number,
        rack_number: data.rack_number,
      });

      // Create alert resolution record
      await supabase
        .from('alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('book_id', bookId)
        .eq('is_resolved', false);

      toast({ title: 'Book location updated successfully' });
    } catch (error) {
      toast({ title: 'Failed to update book', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Correct Book Location</CardTitle>
        {book && <CardDescription>{book.title}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="shelf_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correct Shelf</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {shelves.map(shelf => (
                        <SelectItem key={shelf.id} value={shelf.shelf_number}>
                          {shelf.shelf_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rack_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rack Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={updating}>
              {updating ? 'Updating...' : 'Confirm Correction'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
```

#### Step 2: Add Book Functions
```typescript
// src/services/bookService.ts

export async function getBook(bookId: string): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single();

  if (error) throw error;
  return data as Book;
}

export async function getShelves(): Promise<Shelf[]> {
  const { data, error } = await supabase
    .from('shelves')
    .select('*')
    .order('shelf_number');

  if (error) throw error;
  return data as Shelf[];
}

export async function updateBook(
  bookId: string,
  updates: Partial<Book>
): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', bookId)
    .select()
    .single();

  if (error) throw error;
  return data as Book;
}
```

### Testing
- Test book location updates
- Verify alert resolution
- Check metadata updates
- Test shelf validation

---

## Implementation Priority

### Immediate (Week 1-2)
1. **Excel Enhancement** - Builds on existing functionality
2. **Camera Capture** - High user value
3. **Scan History** - Easy to implement with existing data

### High Priority (Week 2-3)
4. **Book OCR Upload** - Popular feature
5. **Email Notifications** - Essential for alerts
6. **Manual Book Correction** - Support feature

### Medium Priority (Week 3-4)
7. **Analytics & Charts** - Dashboard enhancement
8. **PDF Reports** - Admin/reporting feature

---

## Integration Checklist

- [ ] Install new dependencies (`bun install`)
- [ ] Create database migrations
- [ ] Implement authentication routes
- [ ] Build dashboard components
- [ ] Create service functions
- [ ] Add API endpoints/Supabase functions
- [ ] Test all features
- [ ] Handle edge cases
- [ ] Add error boundaries
- [ ] Implement loading states
- [ ] Add accessibility features
- [ ] Document code
- [ ] Deploy and test in production

---

## Team Assignment Recommendations

**Student 1: Excel & Camera**
- Excel enhancement
- Camera capture
- Image handling

**Student 2: Book Management**
- OCR upload
- Book correction
- Database updates

**Student 3: Scanning & History**
- Scan history module
- Scan details view
- Export functionality

**Student 4: Notifications & Email**
- Email service setup
- Notification templates
- SMTP configuration

**Student 5: Analytics & Reports**
- Charts and analytics
- PDF generation
- Report templates

---

## Testing Strategy

For each feature:
1. **Unit Tests** - Service functions
2. **Component Tests** - React components
3. **Integration Tests** - Database operations
4. **End-to-End Tests** - User workflows

---

## Performance Optimization

- Implement pagination for large tables
- Cache analytics data
- Optimize database queries
- Use lazy loading for images
- Implement debouncing for filters

---

## Security Considerations

- Validate all user inputs
- Check user permissions before operations
- Sanitize file uploads
- Use HTTPS for all communications
- Store sensitive data encrypted

---

## Next Steps

1. Review this roadmap with the team
2. Assign features to team members
3. Set up development environment
4. Create feature branches
5. Implement one feature at a time
6. Test thoroughly before merging
7. Deploy to production when ready

---

**Good luck with your Smart Library project! 🚀**

