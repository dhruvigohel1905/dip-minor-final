import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

// Main app layout component
const AppLayout = ({ activeTab, onActiveTabChange, sidebarOpen, onSidebarToggle, onSidebarClose }: any) => {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Navbar onMenuClick={onSidebarToggle} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            onActiveTabChange(tab);
            onSidebarClose();
          }}
          isOpen={sidebarOpen}
          onClose={onSidebarClose}
        />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Index activeTab={activeTab} onActiveTabChange={onActiveTabChange} />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      <ScrollToTop />
    </div>
  );
};

// Inner app component with auth state
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");

  // Check if current route is login
  const isLoginRoute = location.pathname === "/login";

  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-destructive/10 p-6">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-4">
          <div className="h-16 w-16 bg-destructive/20 text-destructive rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-2xl font-display font-bold">Configuration Error</h2>
          <p className="text-muted-foreground">
            Supabase environment variables are missing. Please ensure <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">VITE_SUPABASE_URL</code> and <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code> are set in your <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">.env</code> file.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading system...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated && !isLoginRoute) {
    return <Login />;
  }

  // Show login page if on login route
  if (isLoginRoute) {
    return <Login />;
  }

  // Show main app layout if authenticated and not on login route
  return (
    <AppLayout
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      sidebarOpen={sidebarOpen}
      onSidebarToggle={() => setSidebarOpen(true)}
      onSidebarClose={() => setSidebarOpen(false)}
    />
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
