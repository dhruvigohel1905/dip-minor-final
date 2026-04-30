-- Create users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'librarian')),
  is_active BOOLEAN DEFAULT true,
  notification_preferences JSONB DEFAULT '{"email": true, "in_app": true, "sms": false}',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create shelves table
CREATE TABLE IF NOT EXISTS shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelf_number VARCHAR(50) NOT NULL UNIQUE,
  floor VARCHAR(50),
  capacity INTEGER DEFAULT 50,
  current_count INTEGER DEFAULT 0,
  last_scanned TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update books table with shelf information
ALTER TABLE books ADD COLUMN IF NOT EXISTS shelf_number VARCHAR(50) REFERENCES shelves(shelf_number);
ALTER TABLE books ADD COLUMN IF NOT EXISTS rack_number VARCHAR(50);
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500);
ALTER TABLE books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shelf_scanned VARCHAR(50) NOT NULL REFERENCES shelves(shelf_number),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_books_found INTEGER NOT NULL,
  missing_books_count INTEGER DEFAULT 0,
  misplaced_books_count INTEGER DEFAULT 0,
  snapshot_url VARCHAR(500),
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create scan_items table
CREATE TABLE IF NOT EXISTS scan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id),
  detected_title VARCHAR(500),
  detected_author VARCHAR(255),
  confidence NUMERIC(3,2),
  position_in_shelf INTEGER,
  is_match BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('misplaced', 'missing', 'new_book')),
  book_id UUID REFERENCES books(id),
  scan_id UUID REFERENCES scans(id),
  expected_shelf VARCHAR(50),
  detected_shelf VARCHAR(50),
  message TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create uploaded_books table
CREATE TABLE IF NOT EXISTS uploaded_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id),
  image_url VARCHAR(500),
  extracted_title VARCHAR(500),
  extracted_author VARCHAR(255),
  ocr_confidence NUMERIC(3,2),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'in_app', 'sms')),
  title VARCHAR(255),
  message TEXT,
  related_alert_id UUID REFERENCES alerts(id),
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_shelf ON scans(shelf_scanned);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at);
CREATE INDEX IF NOT EXISTS idx_scan_items_scan_id ON scan_items(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_items_book_id ON scan_items(book_id);
CREATE INDEX IF NOT EXISTS idx_alerts_book_id ON alerts(book_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_resolved ON alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_uploaded_books_user_id ON uploaded_books(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_books_status ON uploaded_books(status);
CREATE INDEX IF NOT EXISTS idx_books_shelf ON books(shelf_number);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (public read, authenticated update own)
CREATE POLICY "Users can view public profile" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for scans (admins/librarians can read/write)
CREATE POLICY "Authenticated users can read scans" ON scans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own scans" ON scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for alerts (authenticated can read)
CREATE POLICY "Authenticated users can read alerts" ON alerts
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for notifications (users can read own)
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for uploaded_books (users can read own)
CREATE POLICY "Users can read own uploaded books" ON uploaded_books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploaded books" ON uploaded_books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for shelves (public read)
CREATE POLICY "Everyone can read shelves" ON shelves
  FOR SELECT USING (true);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
