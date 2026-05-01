import { BookOpen, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

interface NavbarProps {
  onMenuClick?: () => void;
  bookCount?: number;
}

export function Navbar({ onMenuClick, bookCount }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/10">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Menu button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-foreground hover:bg-primary/10"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Logo and branding */}
        <div className="flex items-center gap-3 flex-1">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/20">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground font-display tracking-tight">
              Smart<span className="text-primary">Library</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">GSFC University</p>
          </div>
        </div>

        {/* Book count badge */}
        {bookCount !== undefined && (
          <div className="ml-auto hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-xs font-semibold border border-primary/20 text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{bookCount} Books</span>
          </div>
        )}

        {/* Theme Switcher */}
        <div className="flex items-center pl-2 border-l border-border/50 ml-2">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
