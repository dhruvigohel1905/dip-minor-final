# Smart Library Shelf Management System - Installation & Setup Guide

## Overview

This guide provides step-by-step instructions to set up the upgraded Smart Library Shelf Management System with all new features implemented.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [New Dependencies](#new-dependencies)
3. [Installation Steps](#installation-steps)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Running the Application](#running-the-application)
7. [Implemented Features](#implemented-features)
8. [Project Structure](#project-structure)
9. [Next Steps & Remaining Features](#next-steps--remaining-features)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js**: v18 or higher
- **Bun** or **npm**: Package manager (project uses bun.lockb)
- **Supabase Account**: For database and authentication
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

---

## New Dependencies

The following new packages have been added to `package.json`:

```json
{
  "html2canvas": "^1.4.1",      // HTML to image conversion for reports
  "jspdf": "^2.5.1",            // PDF generation
  "zustand": "^4.4.1"           // State management library
}
```

These are in addition to existing dependencies like:
- React 18, React Router, React Hook Form
- Tailwind CSS, shadcn/ui
- Recharts for charts
- Supabase for backend
- Framer Motion for animations

---

## Installation Steps

### Step 1: Install Dependencies

```bash
cd "Smart-Library-Shelf-Management-app-main"

# Using bun (recommended, faster)
bun install

# OR using npm
npm install
```

### Step 2: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and API keys
3. Create the following environment file in project root (`.env.local`):

```bash
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Step 3: Run Database Migrations

1. Go to Supabase dashboard → SQL Editor
2. Open the migration file: `supabase/migrations/20260430_complete_schema.sql`
3. Copy all SQL content
4. Create a new SQL query in Supabase SQL Editor
5. Paste and execute the SQL

This creates:
- `users` table (for authentication)
- `shelves` table (for shelf management)
- Enhanced `books` table (with shelf numbers)
- `scans` table (for scan records)
- `scan_items` table (for individual items in scans)
- `alerts` table (for misplaced/missing books)
- `uploaded_books` table (for OCR-based book uploads)
- `notifications` table (for alert notifications)
- All required indexes and Row Level Security (RLS) policies

### Step 4: Enable Supabase Authentication

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Email" provider (should be enabled by default)
3. Go to "URL Configuration" and set:
   - Site URL: `http://localhost:5173` (for development)
   - Redirect URLs: `http://localhost:5173/**`

### Step 5: Create Default Admin User (Optional)

1. In Supabase SQL Editor, run:

```sql
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@library.com',
  crypt('admin123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Get the user ID and insert into users table
INSERT INTO public.users (id, email, full_name, role, is_active, created_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@library.com'),
  'admin@library.com',
  'Library Admin',
  'admin',
  true,
  NOW(),
  NOW()
);
```

**Test Login Credentials:**
- Email: `admin@library.com`
- Password: `admin123456`

---

## Environment Configuration

Create `.env.local` file in project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: API endpoints for external services
VITE_API_BASE_URL=http://localhost:3000
```

---

## Running the Application

### Development Server

```bash
# Start development server (uses Vite)
bun run dev
# OR
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
bun run build
# OR
npm run build
```

### Preview Production Build

```bash
bun run preview
# OR
npm run preview
```

### Run Tests

```bash
# Run all tests
bun run test
# OR
npm run test

# Watch mode
bun run test:watch
# OR
npm run test:watch
```

---

## Implemented Features

### ✅ Phase 1: Authentication & Database
- [x] Complete Supabase schema with 8 tables
- [x] User authentication (login/register)
- [x] Role-based access control (Admin/Librarian)
- [x] JWT session management
- [x] Row Level Security (RLS) policies

### ✅ Phase 2: Enhanced Dashboard
- [x] Statistics cards (Total Books, Scans, Alerts, etc.)
- [x] Alerts panel with real-time updates
- [x] Recent scans display
- [x] Quick action buttons
- [x] System status indicator
- [x] Modern, responsive layout
- [x] Dark/light mode support (existing)

### ✅ Phase 3: Core Services
- [x] Notification service (in-app)
- [x] Scan management service
- [x] Alert management service
- [x] Database integration

### 🟨 Phase 4: Remaining Features (To Implement)

The following features are ready for implementation:

1. **Excel Dataset Enhancement**
   - Add shelf/rack number support
   - Validation for shelf numbers
   - Batch import with progress tracking

2. **Camera Capture**
   - Live camera stream from webcam
   - Capture single shelf images
   - Capture individual book images

3. **Book Upload with OCR**
   - Image upload functionality
   - OCR text extraction
   - Preview form with confidence scores
   - Database auto-save

4. **Scan History Module**
   - Detailed scan records table
   - Filter and search scans
   - View scan details
   - Export scan history

5. **Email Notifications**
   - SMTP configuration
   - Email templates
   - Scheduled notification sending
   - Email delivery tracking

6. **Analytics & Reports**
   - Misplaced books chart
   - Missing books chart
   - Shelf-wise statistics
   - Weekly/monthly trends
   - PDF report generation

7. **Manual Book Correction**
   - UI for updating book locations
   - Shelf reassignment
   - Metadata updates

8. **Advanced Features**
   - Barcode/ISBN scanning
   - Voice alerts (optional)
   - Shelf heatmap visualization

---

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx           # Login/Register form
│   │   └── AuthGuard.tsx           # Route protection
│   ├── dashboard/
│   │   ├── DashboardStats.tsx      # Statistics cards
│   │   ├── AlertsPanel.tsx         # Alerts display
│   │   └── RecentScans.tsx         # Recent scans
│   ├── notifications/
│   │   └── NotificationCenter.tsx  # Notification management
│   ├── ui/                          # shadcn/ui components
│   └── [existing components]
│
├── pages/
│   ├── Login.tsx                   # Login page
│   ├── Dashboard.tsx               # Main dashboard
│   ├── Index.tsx                   # Tab-based layout (existing)
│   └── [other pages]
│
├── services/
│   ├── authService.ts              # Authentication logic
│   ├── notificationService.ts      # Notification management
│   ├── scanService.ts              # Scan and alert management
│   └── [existing services]
│
├── types/
│   ├── auth.ts                     # Auth types
│   ├── database.ts                 # Database types
│   ├── notifications.ts            # Notification types
│   └── [existing types]
│
├── hooks/
│   ├── useAuth.ts                  # Auth state management (Zustand)
│   └── [existing hooks]
│
└── integrations/
    └── supabase/
        └── client.ts               # Supabase client
```

---

## Key Components & Services

### Authentication
- **LoginForm.tsx** - Login/Register UI
- **authService.ts** - Auth functions (login, logout, register)
- **useAuth.ts** - Zustand store for auth state

### Dashboard
- **Dashboard.tsx** - Main dashboard page
- **DashboardStats.tsx** - Statistics cards
- **AlertsPanel.tsx** - Alert management
- **RecentScans.tsx** - Recent scan history

### Notifications
- **notificationService.ts** - In-app notification functions
- **NotificationCenter.tsx** - Notification UI
- Subscribe to real-time updates via Supabase

### Scans & Alerts
- **scanService.ts** - Scan and alert CRUD operations
- Database stats fetching
- Alert resolution

---

## Using the Application

### First Time Login

1. Register new account or use test credentials:
   - Email: `admin@library.com`
   - Password: `admin123456`

2. You'll be directed to Dashboard with:
   - Statistics overview
   - Quick action buttons
   - Alerts panel
   - Recent scans

### Uploading Books (Excel)

1. Click "Upload Dataset" button
2. Select Excel file (CSV or XLSX)
3. Map columns to book fields:
   - Title (required)
   - Author, ISBN, Genre, Publisher, Year
   - Shelf Number, Rack Number (for shelf management)
4. Review and confirm
5. Books are saved to database

### Scanning Shelves

1. Click "Scan Shelf" button
2. Take photo of shelf or upload image
3. System extracts book titles via OCR
4. Matches with library database
5. Detects misplaced/missing books
6. Creates alerts for librarian

### Managing Alerts

1. View alerts in dashboard
2. Click "Resolve" to mark as handled
3. Receive notifications for new alerts
4. Filter by alert type

---

## Database Schema Summary

### Users Table
```sql
- id (UUID): Primary key
- email: User email
- full_name: Display name
- role: 'admin' | 'librarian'
- is_active: Boolean
- notification_preferences: JSON
- last_login: Timestamp
```

### Books Table (Enhanced)
```sql
- id (UUID): Primary key
- title, author, isbn, genre, publisher, year
- shelf_number, rack_number: Location info
- cover_image_url: Book cover image
- additional_metadata: JSON for custom fields
```

### Scans Table
```sql
- id (UUID): Primary key
- user_id: Who performed the scan
- shelf_scanned: Which shelf was scanned
- total_books_found, missing_count, misplaced_count
- snapshot_url: Photo of scan
- timestamp: When scan occurred
```

### Alerts Table
```sql
- id (UUID): Primary key
- alert_type: 'misplaced' | 'missing' | 'new_book'
- book_id, scan_id: Related records
- expected_shelf, detected_shelf
- is_resolved: Boolean
```

### Notifications Table
```sql
- id (UUID): Primary key
- user_id: Who receives notification
- type: 'email' | 'in_app' | 'sms'
- title, message: Content
- is_read: Boolean
- created_at: Timestamp
```

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
1. Check `.env.local` has correct Supabase URL and key
2. Verify Supabase project is active
3. Check internet connection
4. Clear browser cache and reload

### Issue: "Migration failed"

**Solution:**
1. Check SQL syntax in migration file
2. Ensure all SQL commands complete successfully
3. Check for naming conflicts
4. Review Supabase error messages in dashboard

### Issue: "Login not working"

**Solution:**
1. Verify user exists in Supabase `users` table
2. Check password is correct
3. Clear browser cookies
4. Verify email verification if required

### Issue: "Notifications not showing"

**Solution:**
1. Check Row Level Security (RLS) policies are applied
2. Verify user_id is correct in database
3. Check browser console for JavaScript errors
4. Ensure Supabase real-time subscriptions enabled

### Issue: "OCR not extracting text"

**Solution:**
1. Verify Supabase Function `ocr-scan` is deployed
2. Check image quality and resolution
3. Ensure sufficient lighting in photos
4. Try clearer shelf photos

---

## Development Notes

### Adding New Features

1. **Create types** in `src/types/`
2. **Create service** in `src/services/` for data operations
3. **Create components** in `src/components/` for UI
4. **Add routes** in `src/App.tsx` if needed
5. **Update navigation** in sidebar/navbar

### Database Queries

All database access goes through services in `src/services/`:
- `authService.ts` - User management
- `scanService.ts` - Scans and alerts
- `notificationService.ts` - Notifications

### State Management

Using **Zustand** for global state:
- `useAuth` - Authentication state
- Create more stores in `hooks/` as needed

### UI Components

All UI uses **shadcn/ui** components from `src/components/ui/`

---

## Team Development Guidelines

Since this is a team project (5 students), follow these guidelines:

1. **Branch naming**: `feature/feature-name`, `fix/bug-name`
2. **Commit messages**: `feat: add feature`, `fix: resolve issue`
3. **Code style**: Use ESLint (`npm run lint`)
4. **Testing**: Write tests for critical features
5. **Documentation**: Update comments and README

---

## Deployment

### Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys from GitHub
# Set environment variables in Vercel dashboard
```

### Deploy to Netlify

```bash
# Build
npm run build

# Output is in dist/
# Connect to Netlify for auto-deployment
```

---

## Support & Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

---

## Next Steps

1. **Test the login system** with test credentials
2. **Upload sample book data** via Excel
3. **Configure email notifications** (SMTP settings)
4. **Implement remaining features** from Phase 4
5. **Test with real shelf images**
6. **Deploy to production**

---

**Project Version**: 1.0.0  
**Last Updated**: April 30, 2026  
**Maintained by**: Team of 5 Students
