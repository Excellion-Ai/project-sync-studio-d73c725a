import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
}

const WaitlistModal = ({ open, onClose }: WaitlistModalProps) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({ email, source: "modal_popup" });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already on the waitlist! We'll be in touch soon.");
          setSubmitted(true);
        } else {
          throw error;
        }
      } else {
        // Fire-and-forget welcome email
        supabase.functions.invoke("waitlist-welcome", { body: { email } }).catch(() => {});
        toast.success("You're in! Check your inbox for a welcome email.");
        setSubmitted(true);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-2xl border border-primary/20 bg-[hsl(var(--card))] p-8 sm:p-10 shadow-[0_0_60px_-10px_hsl(var(--primary)/0.3)]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3">
            Excellion Launches April 7th
          </h2>
          <p className="text-muted-foreground font-body text-base mb-8">
            Join the waitlist to get early access and locked-in pricing forever.
          </p>

          {submitted ? (
            <div className="py-4">
              <p className="text-primary font-heading font-semibold text-lg mb-2">You're on the list! 🎉</p>
              <p className="text-muted-foreground font-body text-sm">We'll email you when the doors open.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 rounded-xl btn-primary text-sm font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Claim My Early Access →"
                )}
              </button>
            </form>
          )}

          <p className="text-xs text-muted-foreground font-body mt-6">
            🚀 April 7th is coming fast. Only limited spots available.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaitlistModal;
