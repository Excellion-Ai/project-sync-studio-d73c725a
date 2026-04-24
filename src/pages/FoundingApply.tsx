import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const FoundingApply = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    instagram: "",
    tiktok: "",
    niche: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (form.reason.length < 20) {
      setError("Tell us a bit more about why you want to join (at least 20 characters).");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: dbErr } = await (supabase as any)
      .from("founding_coach_applications")
      .insert({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        instagram: form.instagram.trim() || null,
        tiktok: form.tiktok.trim() || null,
        niche: form.niche,
        reason: form.reason.trim(),
      });

    if (dbErr) {
      console.error("[founding-apply]", dbErr);
      setError(dbErr.message || "Something went wrong. Try again.");
      setSubmitting(false);
      return;
    }

    navigate("/founding/thanks");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-20">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-3">
              Apply to be a{" "}
              <span className="text-gradient-gold">Founding Coach</span>
            </h1>
            <p className="text-muted-foreground font-body text-sm max-w-md mx-auto">
              We're accepting 20 coaches into the founding cohort. Free lifetime
              access, direct input on the product, and your name on the wall.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                Full name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={set("full_name")}
                placeholder="Jane Smith"
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder="jane@example.com"
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                  Instagram handle
                </label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={set("instagram")}
                  placeholder="@janefit"
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                  TikTok handle
                </label>
                <input
                  type="text"
                  value={form.tiktok}
                  onChange={set("tiktok")}
                  placeholder="@janefit"
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                What do you coach? <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={form.niche}
                onChange={set("niche")}
                placeholder="e.g. strength training for women over 40"
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                Why do you want to be a Founding Coach?{" "}
                <span className="text-destructive">*</span>
              </label>
              <textarea
                required
                minLength={20}
                rows={4}
                value={form.reason}
                onChange={set("reason")}
                placeholder="Tell us about your coaching business, your audience, and what you'd build first on Excellion..."
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] px-6 py-3 rounded-xl btn-primary text-sm font-body font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center font-body">
              We review every application. Founding Coaches get free lifetime
              access and a direct line to the founder.
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FoundingApply;
