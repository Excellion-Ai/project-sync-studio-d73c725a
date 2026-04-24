import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "excellion-fc-strip-dismissed";

const VISIBLE_PATHS = ["/", "/founding", "/founding/apply", "/founding/thanks"];

const FoundingScarcityStrip = () => {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== "true") {
      setDismissed(false);
    }
  }, []);

  if (!mounted || dismissed) return null;

  const isVisible = VISIBLE_PATHS.includes(location.pathname);
  if (!isVisible) return null;

  // Hide on auth and authenticated app routes
  if (location.pathname.startsWith("/auth")) return null;
  if (user && location.pathname.startsWith("/dashboard")) return null;
  if (user && location.pathname.startsWith("/studio")) return null;
  if (user && location.pathname.startsWith("/secret-builder")) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-[#0d0d0d] border-b border-primary/20 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-sm font-body">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <span className="text-foreground/90">
          <strong className="text-foreground">10 Founding Coach spots.</strong>{" "}
          Free for life.
        </span>
        <Link
          to="/founding/apply"
          className="text-primary font-semibold hover:underline whitespace-nowrap"
        >
          Claim yours &rarr;
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="ml-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default FoundingScarcityStrip;
