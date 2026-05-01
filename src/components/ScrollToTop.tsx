import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const mainRef = useRef<HTMLElement | Window | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const main = document.querySelector('main') as HTMLElement | null;
      mainRef.current = main || window;
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mainRef.current) return;

    const handleScroll = () => {
      if (!mainRef.current) return;
      
      const scrollTop = mainRef.current === window 
        ? window.scrollY 
        : (mainRef.current as HTMLElement).scrollTop;
      
      setIsVisible(scrollTop > 200);
    };

    const target = mainRef.current;
    target.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      target.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLaunch = () => {
    setIsLaunching(true);
    
    // Scroll to top
    if (mainRef.current === window) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (mainRef.current) {
      (mainRef.current as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
    }

    // Reset launching state after animation completes
    setTimeout(() => {
      setIsLaunching(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 30 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-10 right-10 z-[9999]"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleLaunch}
                className={`h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-white shadow-2xl hover:shadow-primary/40 transition-all duration-300 flex items-center justify-center group border-2 border-white/20 ${isLaunching ? 'rocket-launch' : ''}`}
                aria-label="Scroll to top"
              >
                <Rocket className={`h-8 w-8 ${!isLaunching && 'group-hover:animate-bounce group-hover:-translate-y-1'} transition-transform`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-primary text-white border-primary font-semibold text-sm">
              Launch to Top!
            </TooltipContent>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
