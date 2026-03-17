import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const WaitlistSection = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("waitlist" as any)
      .insert([{ email, source: "landing_page" }] as any);

    setSubmitting(false);

    if (error) {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
      return;
    }

    setSubmitted(true);
    toast({ title: "You're on the list! 🎉", description: "We'll notify you when early access opens." });
  };

  return (
    <section className="py-[60px] bg-background relative overflow-hidden">
      {/* Gold radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 40% at 50% 50%, hsl(43 52% 54% / 0.08), transparent)"
      }} />

      <div className="max-w-2xl mx-auto px-4 relative z-10 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4 leading-tight"
        >
          The AI Built for Fitness Creators Who Are Done Leaving Money on the Table
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground font-body text-base sm:text-lg mb-8"
        >
          Excellion launches April 7th. Get early access before your competitors do.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {submitted ? (
            <div className="premium-card p-8 text-center">
              <p className="text-primary font-heading font-bold text-xl mb-2">You're in! 🎉</p>
              <p className="text-muted-foreground font-body text-sm">Check your inbox — we'll send you early access details before April 7th.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12 rounded-xl border border-border bg-card px-4 text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="submit"
                disabled={submitting}
                className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-heading font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim My Early Access →"}
              </button>
            </form>
          )}
        </motion.div>

        {!submitted && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            className="text-muted-foreground font-body text-xs mt-4"
          >
            🚀 April 7th is coming fast. Only limited spots available.
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.45 }}
          className="text-muted-foreground/60 font-body text-xs mt-8 italic"
        >
          Spots are limited. The creators who move first will lead. Everyone else will follow.
        </motion.p>
      </div>
    </section>
  );
};

export default WaitlistSection;
