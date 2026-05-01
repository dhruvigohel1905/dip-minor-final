import { ScanLine, BookOpen, Upload, Aperture, X, Bell, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    id: "scan",
    label: "Scan Books",
    icon: ScanLine,
    description: "Capture & scan shelf books",
  },

  {
    id: "library",
    label: "Library Overview",
    icon: BookOpen,
    description: "View all books in library",
  },
  {
    id: "import",
    label: "Import Dataset",
    icon: BarChart3,
    description: "Upload Excel or Image data",
  },
  {
    id: "alerts",
    label: "Alerts Center",
    icon: Bell,
    description: "Manage library alerts",
  },
  {
    id: "dip",
    label: "DIP Analysis",
    icon: Aperture,
    description: "Image processing tools",
  },
];

export function Sidebar({ activeTab, onTabChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 z-40 shadow-2xl",
          "md:sticky md:top-16 md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <nav className="flex flex-col h-full">
          {/* Close button for mobile */}
          <div className="md:hidden flex justify-end p-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent/20"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu items */}
          <div className="flex-1 space-y-2 px-4 py-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-4 rounded-xl transition-all duration-300 text-left group",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg shadow-sidebar-accent/20 ring-1 ring-white/10"
                      : "hover:bg-sidebar-accent/10 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors duration-300",
                    isActive ? "bg-white/20" : "bg-sidebar-foreground/5 group-hover:bg-sidebar-foreground/10"
                  )}>
                    <Icon className="h-5 w-5 flex-shrink-0" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-semibold text-sm tracking-tight">{item.label}</p>
                    <p className={cn(
                      "text-[10px] leading-tight",
                      isActive ? "text-white/80" : "text-sidebar-foreground/40"
                    )}>{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer branding */}
          <div className="p-6 border-t border-sidebar-border bg-black/5">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/60 mb-1">
                GSFC University
              </p>
              <div className="h-1 w-8 bg-sidebar-accent/50 rounded-full mb-2" />
              <p className="text-[10px] font-medium text-sidebar-foreground/40">Smart Management System v2.0</p>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
