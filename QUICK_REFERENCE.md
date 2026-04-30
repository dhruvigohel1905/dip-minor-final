# Quick Reference Guide - Smart Library System

## 📖 Documentation Map

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **PROJECT_SUMMARY.md** (this folder) | Overview of everything done | 10 min |
| **INSTALLATION_GUIDE.md** | Setup instructions | 15 min |
| **FEATURES_SUMMARY.md** | What's implemented | 15 min |
| **DEVELOPMENT_ROADMAP.md** | How to implement remaining 8 features | 30 min |

**Recommended reading order:**
1. PROJECT_SUMMARY.md (you are here)
2. INSTALLATION_GUIDE.md (to set up)
3. DEVELOPMENT_ROADMAP.md (to start implementing)

---

## 🗂️ Code Navigation Guide

### Authentication (5 files)
```
src/
├── services/authService.ts ..................... Login/logout logic
├── hooks/useAuth.ts ........................... Auth state management
├── components/auth/
│   ├── LoginForm.tsx .......................... Login/register UI
│   └── AuthGuard.tsx .......................... Route protection
└── pages/Login.tsx ............................ Login page

Key Functions:
- login(credentials) - User login
- logout() - Logout user
- register(data) - Create account
- useAuth() - Access auth state
```

### Dashboard (4 files)
```
src/
├── pages/Dashboard.tsx ......................... Main dashboard page
└── components/dashboard/
    ├── DashboardStats.tsx ..................... Statistics cards
    ├── AlertsPanel.tsx ........................ Alerts display
    └── RecentScans.tsx ........................ Recent scans list

Key Features:
- 5 statistics cards (real-time updated)
- Alert management with resolution
- Recent scan history display
- Quick action buttons
```

### Notifications (2 files)
```
src/
├── services/notificationService.ts ........... Notification functions
└── components/notifications/
    └── NotificationCenter.tsx ................ Notification UI

Key Functions:
- sendInAppNotification() - Create notification
- getUserNotifications() - Fetch notifications
- markNotificationAsRead() - Mark as read
- subscribeToNotifications() - Real-time updates
```

### Scans & Alerts (1 file)
```
src/
└── services/scanService.ts ................... Scan and alert management

Key Functions:
- createScan() - Create scan record
- getScanWithDetails() - Get scan data
- createAlert() - Create alert
- resolveAlert() - Resolve alert
- getDashboardStats() - Get statistics
```

### Database & Types (4 files)
```
src/
├── types/
│   ├── database.ts ........................... Database entity types
│   ├── auth.ts .............................. Auth types
│   └── notifications.ts ..................... Notification types
└── supabase/migrations/
    └── 20260430_complete_schema.sql ........ Database schema

Database Tables:
- users (authentication)
- books (library catalog)
- shelves (shelf management)
- scans (scan records)
- scan_items (items in scans)
- alerts (misplaced/missing)
- uploaded_books (OCR uploads)
- notifications (user alerts)
```

---

## 🚀 Getting Started (5 minutes)

### 1. Install
```bash
cd Smart-Library-Shelf-Management-app-main
bun install
```

### 2. Configure
Create `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup
- Go to Supabase dashboard
- SQL Editor → New Query
- Paste: `supabase/migrations/20260430_complete_schema.sql`
- Execute

### 4. Run
```bash
bun run dev
# Opens http://localhost:5173
```

### 5. Test Login
- Email: `admin@library.com`
- Password: `admin123456`
(Or create new account)

---

## 🧭 Finding Your Way Around

### I want to...

**...understand authentication**
→ Read: `src/services/authService.ts`
→ See UI: `src/components/auth/LoginForm.tsx`
→ Understand state: `src/hooks/useAuth.ts`

**...see the dashboard**
→ Go to: `http://localhost:5173` (after login)
→ View files: `src/pages/Dashboard.tsx`, `src/components/dashboard/`

**...work with alerts**
→ Service: `src/services/scanService.ts` (createAlert, resolveAlert)
→ UI: `src/components/dashboard/AlertsPanel.tsx`
→ Database: See `alerts` table in schema

**...implement a new feature**
→ Read: `DEVELOPMENT_ROADMAP.md`
→ Find your feature section
→ Follow step-by-step guide

**...understand the database**
→ Read: `src/types/database.ts` (all types)
→ View schema: `supabase/migrations/20260430_complete_schema.sql`
→ Check tables: Supabase → Database → Tables

**...add a new page**
1. Create file: `src/pages/MyPage.tsx`
2. Add route in `src/App.tsx`
3. Add menu item in `src/components/Sidebar.tsx`

**...call the database**
→ See examples in: `src/services/scanService.ts`
→ Pattern: `supabase.from('table').select()`

**...show real-time updates**
→ See: `src/services/notificationService.ts` (subscribeToNotifications)
→ Pattern: `supabase.channel().on('postgres_changes')`

---

## 📊 Architecture Overview

```
User Interface (React Components)
         ↓
State Management (Zustand / useState)
         ↓
Service Layer (Services + Hooks)
         ↓
Supabase Client
         ↓
PostgreSQL Database
         ↓
Row Level Security Policies
```

### Data Flow Example: Alert
```
User clicks "Resolve Alert"
    ↓
AlertsPanel.tsx calls resolveAlert()
    ↓
scanService.ts updates database
    ↓
Supabase Updates alerts table
    ↓
RLS policy checks user permissions
    ↓
Real-time subscription triggers
    ↓
UI automatically updates
    ↓
Toast notification shows success
```

---

## 🔄 Common Tasks

### Display data from database
```typescript
// Step 1: Create service function
export async function getData() {
  const { data, error } = await supabase
    .from('table_name')
    .select('*');
  if (error) throw error;
  return data;
}

// Step 2: Use in component
useEffect(() => {
  const data = await getData();
  setData(data);
}, []);
```

### Create real-time updates
```typescript
// Subscribe to changes
const subscription = supabase
  .channel('table_name')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'table_name' },
    (payload) => console.log(payload.new)
  )
  .subscribe();
```

### Show toast notification
```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();
toast({
  title: "Success",
  description: "Action completed",
  variant: "default" // or "destructive"
});
```

### Protect a route
```typescript
// In src/App.tsx
<Route path="/protected" element={
  <ProtectedRoute>
    <YourComponent />
  </ProtectedRoute>
} />
```

---

## 🎯 8 Features Waiting to Be Built

| # | Feature | Where to Start | Files to Create |
|---|---------|----------------|-----------------|
| 1 | Excel Enhancement | DEVELOPMENT_ROADMAP.md §1 | 2 files |
| 2 | Camera Capture | DEVELOPMENT_ROADMAP.md §2 | 2 files |
| 3 | Book OCR Upload | DEVELOPMENT_ROADMAP.md §3 | 2 files |
| 4 | Scan History | DEVELOPMENT_ROADMAP.md §4 | 3 files |
| 5 | Email Notifications | DEVELOPMENT_ROADMAP.md §5 | 1 file |
| 6 | Analytics & Charts | DEVELOPMENT_ROADMAP.md §6 | 3 files |
| 7 | PDF Reports | DEVELOPMENT_ROADMAP.md §7 | 1 file |
| 8 | Manual Correction | DEVELOPMENT_ROADMAP.md §8 | 1 file |

Each section includes code examples and step-by-step instructions.

---

## 🐛 Debugging Tips

### Issue: Login not working
- Check `.env.local` has correct Supabase URL/key
- Verify user exists in `users` table
- Check browser console for errors
- Try creating new account

### Issue: Database query failing
- Check table name is correct
- Verify column names match schema
- Check RLS policies allow the action
- See error message in console

### Issue: Alerts not showing
- Verify alerts exist in database
- Check if `is_resolved = false`
- Ensure user has permission via RLS
- Check browser network tab

### Issue: Styles not applying
- Ensure component uses classes from Tailwind
- Check shadcn components imported correctly
- Verify class names match Tailwind syntax
- Run `bun run build` to check for errors

### Issue: Real-time updates not working
- Verify Supabase real-time enabled
- Check channel name matches table
- Ensure user has read permission via RLS
- Check browser console for subscription errors

---

## 📦 Key Dependencies

```json
{
  "react": "UI library",
  "react-router-dom": "Routing",
  "react-hook-form": "Form handling",
  "zod": "Validation",
  "zustand": "State management",
  "@supabase/supabase-js": "Database client",
  "tailwindcss": "Styling",
  "@radix-ui": "UI components",
  "recharts": "Charts",
  "jspdf": "PDF generation",
  "framer-motion": "Animations"
}
```

---

## 🔗 Important Links

- [Supabase Console](https://app.supabase.com)
- [Local Project](http://localhost:5173)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

---

## 📝 File Naming Conventions

- Components: PascalCase (Button.tsx)
- Pages: PascalCase with "Page" suffix (LoginPage.tsx)
- Services: camelCase with "Service" suffix (authService.ts)
- Hooks: camelCase with "use" prefix (useAuth.ts)
- Types: camelCase in folder "types" (auth.ts)

---

## ✅ Checklist for New Features

When implementing a new feature:
- [ ] Create TypeScript types in `src/types/`
- [ ] Create service functions in `src/services/`
- [ ] Create React components in `src/components/`
- [ ] Add database tables/columns in migration
- [ ] Create page if needed in `src/pages/`
- [ ] Add route in `src/App.tsx`
- [ ] Add navigation item in sidebar
- [ ] Test locally
- [ ] Handle errors gracefully
- [ ] Add loading states
- [ ] Write comments/documentation
- [ ] Test with different roles (admin/librarian)

---

## 🎓 Learning Path

**Beginner Tasks** (Start here)
1. Read PROJECT_SUMMARY.md
2. Read INSTALLATION_GUIDE.md
3. Set up locally
4. Test login
5. Explore dashboard

**Intermediate Tasks**
1. Read a feature section in DEVELOPMENT_ROADMAP.md
2. Create needed types
3. Create service functions
4. Create components
5. Test locally

**Advanced Tasks**
1. Implement real-time subscriptions
2. Optimize database queries
3. Add complex business logic
4. Handle edge cases

---

## 💡 Pro Tips

1. **Use TypeScript** - It catches bugs before runtime
2. **Check Supabase docs** - For latest API changes
3. **Test locally first** - Before deploying
4. **Use React DevTools** - To debug state
5. **Check network tab** - To debug API calls
6. **Read error messages** - They usually explain the issue
7. **Keep components small** - Easier to understand and test
8. **Comment complex logic** - Help your teammates understand

---

## 🚀 Ready to Start?

1. **First time?** → Read INSTALLATION_GUIDE.md
2. **Want to implement a feature?** → Read DEVELOPMENT_ROADMAP.md
3. **Need help navigating code?** → Use this document
4. **Questions about specific feature?** → Check that section in DEVELOPMENT_ROADMAP.md

---

**You've got this! Let's build something awesome! 🎉**

