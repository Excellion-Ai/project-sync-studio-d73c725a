import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { identifyUser } from "@/lib/analytics";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const goToDashboard = (userId?: string, email?: string) => {
      if (cancelled) return;
      if (userId) {
        try { identifyUser(userId, { email }); } catch { /* best-effort */ }
      }
      navigate("/dashboard", { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        goToDashboard(session.user.id, session.user.email);
      }
    });

    const fallbackTimer = setTimeout(async () => {
      if (cancelled) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        goToDashboard(session.user.id, session.user.email);
      }
    }, 2000);

    const errorTimer = setTimeout(() => {
      if (!cancelled) {
        setErrorMsg("Sign-in timed out. Please try again.");
      }
    }, 15000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
      clearTimeout(errorTimer);
    };
  }, [navigate]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-heading font-bold text-foreground mb-2">Sign-in failed</h1>
          <p className="text-sm text-muted-foreground font-body mb-6 break-words">{errorMsg}</p>
          <button
            type="button"
            onClick={() => navigate("/auth", { replace: true })}
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm touch-manipulation"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-body">Completing sign-in…</p>
      </div>
    </div>
  );
};

export default AuthCallback;
