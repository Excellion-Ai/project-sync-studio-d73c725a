import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Dumbbell, GraduationCap, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

const destinationFor = (role: UserRole) => (role === "coach" ? "/dashboard" : "/dashboard/student");

const RoleSelection = () => {
  const { user, ready, role, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);

  // If auth is ready and we somehow end up here with a role already set,
  // bounce to the correct dashboard.
  useEffect(() => {
    if (ready && role) {
      navigate(destinationFor(role), { replace: true });
    }
  }, [ready, role, navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?redirect=/onboarding/role" replace />;
  }

  const handleContinue = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ role: selected, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      navigate(destinationFor(selected), { replace: true });
    } catch (err: any) {
      console.error("[role-selection] save failed", err);
      toast({
        title: "Couldn't save your role",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  const options: { value: UserRole; title: string; description: string; icon: React.ElementType; bullets: string[] }[] = [
    {
      value: "coach",
      title: "I'm a Coach",
      description: "Build and sell your own fitness course.",
      icon: Dumbbell,
      bullets: [
        "Generate a course outline with AI",
        "Publish on your own domain",
        "Keep 100% of the revenue",
      ],
    },
    {
      value: "student",
      title: "I'm a Student",
      description: "Enroll in a coach's course.",
      icon: GraduationCap,
      bullets: [
        "Track progress across lessons",
        "Earn completion certificates",
        "Access on any device",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-3">
              Are you a <span className="text-gradient-gold">Coach</span> or a <span className="text-gradient-gold">Student</span>?
            </h1>
            <p className="text-muted-foreground text-base font-body">
              Pick the experience that fits you. You can change this later in settings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selected === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelected(opt.value)}
                  disabled={saving}
                  className={`relative text-left p-6 rounded-2xl border-2 transition-all touch-manipulation ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-[0_0_0_4px_rgba(201,168,76,0.15)]"
                      : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-6 h-6" />
                  </span>
                  <h2 className="text-xl font-heading font-bold text-foreground mb-1">{opt.title}</h2>
                  <p className="text-sm text-muted-foreground font-body mb-4">{opt.description}</p>
                  <ul className="space-y-2">
                    {opt.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-foreground/90 font-body">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selected || saving}
              className="min-h-[48px] px-8 py-3 rounded-xl btn-primary text-sm font-medium inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Continue
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleSelection;
