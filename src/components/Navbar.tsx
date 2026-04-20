import { BookOpen, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

interface NavbarProps {
  onMenuClick?: () => void;
  bookCount?: number;
}

export function Navbar({ onMenuClick, bookCount }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm support-backdrop-blur">
      <div className="flex h-16 items-center gap-4 px-4">
        {/* Menu button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Logo and branding */}
        <div className="flex items-center gap-3 flex-1">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground font-display">Smart Library</h1>
            <p className="text-xs text-muted-foreground">GSFC University</p>
          </div>
        </div>

        {/* Book count badge */}
        {bookCount !== undefined && (
          <div className="ml-auto hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 text-sm font-medium">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-foreground">{bookCount} Books</span>
          </div>
        )}

        {/* Theme Switcher */}
        <ThemeSwitcher />
      </div>
    </header>
  );
}
