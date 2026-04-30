import { ScanLine, BookOpen, Upload, Aperture, X, ScanBarcode } from "lucide-react";
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
    id: "barcode",
    label: "Barcode Scanner",
    icon: ScanBarcode,
    description: "Scan ISBN / barcode",
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
    icon: Upload,
    description: "Upload Excel data",
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
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-primary text-white border-r border-primary/20 transition-all duration-300 z-40",
          "md:sticky md:top-16",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <nav className="flex flex-col h-full">
          {/* Close button for mobile */}
          <div className="md:hidden flex justify-end p-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu items */}
          <div className="flex-1 space-y-2 px-3 py-4">
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
                    "w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left",
                    isActive
                      ? "bg-accent text-accent-foreground shadow-lg"
                      : "hover:bg-white/10 text-white"
                  )}
                >
                  <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs opacity-80">{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer branding */}
          <div className="p-4 border-t border-white/10">
            <p className="text-xs text-center opacity-75">
              © GSFC University Library
            </p>
            <p className="text-xs text-center opacity-75">Smart Management System</p>
          </div>
        </nav>
      </aside>
    </>
  );
}
