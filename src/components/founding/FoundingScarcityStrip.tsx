import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const STORAGE_KEY = "excellion-fc-strip-dismissed";

type Props = {
  claimed?: number;
};

const FoundingScarcityStrip = ({ claimed = 0 }: Props) => {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    setMounted(true);
  }, []);

  if (!mounted || dismissed) return null;

  const isFull = claimed >= 10;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-[hsl(38_10%_9%)] border-b border-[hsl(42_55%_48%/0.25)] py-3 px-6">
      <div className="mx-auto max-w-[1120px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-center relative">
        <span
          className={`inline-block w-2 h-2 rounded-full bg-gold ${
            isFull ? "" : "animate-[pulse_2s_ease-in-out_infinite]"
          }`}
          aria-hidden="true"
        />
        {isFull ? (
          <p className="font-[DM_Sans] text-[13px] sm:text-sm text-foreground">
            10/10 Founding Coaches claimed. Standard pricing in effect.
          </p>
        ) : (
          <>
            <p className="font-[DM_Sans] text-[13px] sm:text-sm text-foreground">
              10 Founding Coach spots. Free for life.
            </p>
            <Link
              to="/founding"
              className="font-[DM_Sans] text-[13px] sm:text-sm font-medium text-gold hover:underline"
            >
              Claim yours →
            </Link>
          </>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute right-0 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FoundingScarcityStrip;