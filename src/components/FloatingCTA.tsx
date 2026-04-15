import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const FloatingCTA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const ctaSection = document.querySelector("#cta-section");
      if (!ctaSection) { setVisible(true); return; }
      const rect = ctaSection.getBoundingClientRect();
      setVisible(rect.top > window.innerHeight);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    navigate(user ? "/dashboard" : "/auth");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none sm:bottom-6 sm:right-6 sm:left-auto"
        >
          {/* Mobile: full-width bar with gradient fade */}
          <div className="sm:hidden pointer-events-auto">
            <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-6 pb-4 px-4">
              <button
                onClick={handleClick}
                className="w-full py-3.5 rounded-xl btn-primary text-sm font-heading font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                Start Building
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop: pill button */}
          <button
            onClick={handleClick}
            className="hidden sm:flex pointer-events-auto items-center gap-2 px-7 py-3.5 rounded-full btn-primary text-sm font-heading font-bold shadow-lg shadow-[hsl(var(--gold)/0.25)]"
          >
            Start Building
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCTA;
