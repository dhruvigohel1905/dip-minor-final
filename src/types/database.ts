// Database types - matches Supabase schema

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'librarian';
  is_active: boolean;
  notification_preferences: {
    email: boolean;
    in_app: boolean;
    sms: boolean;
  };
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  genre: string | null;
  publisher: string | null;
  year: number | null;
  shelf_number: string | null;
  rack_number: string | null;
  cover_image_url: string | null;
  additional_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Shelf {
  id: string;
  shelf_number: string;
  floor: string | null;
  capacity: number;
  current_count: number;
  last_scanned: string | null;
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  shelf_scanned: string;
  timestamp: string;
  total_books_found: number;
  missing_books_count: number;
  misplaced_books_count: number;
  correct_books_count: number;
  snapshot_url: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface ScanItem {
  id: string;
  scan_id: string;
  book_id: string | null;
  detected_title: string | null;
  detected_author: string | null;
  confidence: number | null;
  position_in_shelf: number | null;
  is_match: boolean;
  is_misplaced: boolean;
  expected_shelf?: string | null;
  created_at: string;
}

export interface Alert {
  id: string;
  alert_type: 'misplaced' | 'missing' | 'new_book';
  book_id: string | null;
  scan_id: string | null;
  expected_shelf: string | null;
  detected_shelf: string | null;
  message: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadedBook {
  id: string;
  user_id: string;
  book_id: string | null;
  image_url: string | null;
  extracted_title: string | null;
  extracted_author: string | null;
  extracted_isbn: string | null;
  ocr_confidence: number | null;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadedImage {
  id: string;
  user_id: string;
  image_url: string;
  extracted_data: Record<string, any> | null;
  processed_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'email' | 'in_app' | 'sms';
  title: string | null;
  message: string | null;
  related_alert_id: string | null;
  is_read: boolean;
  is_resolved?: boolean;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

// Extended types for frontend use
export interface ScanWithDetails extends Scan {
  user?: User;
  items?: ScanItem[];
  alerts?: Alert[];
}

export interface AlertWithBook extends Alert {
  book?: Book;
}

export interface NotificationWithAlert extends Notification {
  alert?: AlertWithBook;
}
