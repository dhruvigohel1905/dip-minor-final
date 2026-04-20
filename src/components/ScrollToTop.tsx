import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const mainRef = useRef<HTMLElement | Window | null>(null);

  useEffect(() => {
    // Wait a bit for DOM to be ready, then find the main element
    const timer = setTimeout(() => {
      const main = document.querySelector('main') as HTMLElement | null;
      mainRef.current = main || window;
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mainRef.current) return;

    // Show button when scrolled down
    const handleScroll = () => {
      if (!mainRef.current) return;
      
      const scrollTop = mainRef.current === window 
        ? window.scrollY 
        : (mainRef.current as HTMLElement).scrollTop;
      
      setIsVisible(scrollTop > 100);
    };

    // Scroll to top smoothly
    const scrollToTop = () => {
      if (!mainRef.current) return;
      
      if (mainRef.current === window) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        (mainRef.current as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    const target = mainRef.current;
    target.addEventListener("scroll", handleScroll, { passive: true });
    (window as any).scrollToTopFn = scrollToTop;

    return () => {
      target.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 30 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-10 right-10 z-[9999]"
          style={{ position: 'fixed' }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
                className="h-16 w-16 rounded-full bg-primary hover:bg-primary/85 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group border-2 border-white/20"
                aria-label="Scroll to top"
              >
                <Rocket className="h-8 w-8 group-hover:animate-bounce group-hover:-translate-y-1 transition-transform" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-primary text-white border-primary font-semibold text-sm">
              Back to Top
            </TooltipContent>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
