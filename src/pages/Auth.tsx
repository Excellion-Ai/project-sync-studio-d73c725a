import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { analytics, identifyUser } from "@/lib/analytics";

type Mode = "signup" | "signin";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Re-parse the URL whenever the route changes so toggling between
  // ?mode=signup and ?mode=signin updates the UI live.
  const { mode, explicitRedirect }: { mode: Mode; explicitRedirect: string | null } = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const raw = sp.get("mode");
    // Default to signup — ~99% of /auth traffic is new visitors.
    const m: Mode = raw === "signin" ? "signin" : "signup";
    return { mode: m, explicitRedirect: sp.get("redirect") };
  }, [location.search]);

  // Build a URL that toggles mode while preserving the redirect param.
  const toggleHref = useMemo(() => {
    const target: Mode = mode === "signup" ? "signin" : "signup";
    const sp = new URLSearchParams();
    sp.set("mode", target);
    if (explicitRedirect) sp.set("redirect", explicitRedirect);
    return `/auth?${sp.toString()}`;
  }, [mode, explicitRedirect]);

  useEffect(() => {
    let cancelled = false;

    const routeAfterAuth = async (session: any) => {
      if (!session || cancelled) return;
      identifyUser(session.user.id, { email: session.user.email });
      const dest = explicitRedirect || "/dashboard";
      navigate(dest, { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (event === "SIGNED_IN" && session.user.created_at && Date.now() - new Date(session.user.created_at).getTime() < 60_000) {
          const method = session.user.app_metadata?.provider || "email";
          analytics.signedUp({ method, email: session.user.email });
        }
        void routeAfterAuth(session);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) void routeAfterAuth(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate, explicitRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        // If email confirmations are enabled, the user needs to click the
        // link. Otherwise onAuthStateChange fires and routes them.
        toast({
          title: "Account created",
          description: "You're signed in and ready to go.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: mode === "signup" ? "Couldn't create account" : "Couldn't sign in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) {
        toast({ title: "Sign-in error", description: error.message, variant: "destructive" });
      } else if (!data?.url) {
        toast({ title: "Sign-in error", description: "No redirect URL returned. Google provider may be disabled.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Sign-in error", description: err?.message || "Unexpected error", variant: "destructive" });
    }
  };

  const heading = mode === "signup" ? "Create your Excellion account" : "Welcome back";
  const subcopy = mode === "signup"
    ? "Build your first fitness course in 60 seconds"
    : "Sign in to your Excellion dashboard";
  const googleLabel = mode === "signup" ? "Sign up with Google" : "Sign in with Google";
  const submitLabel = mode === "signup" ? "Create Account" : "Sign In";
  const togglePrompt = mode === "signup" ? "Already have an account?" : "New to Excellion?";
  const toggleCta = mode === "signup" ? "Sign in" : "Create account";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md glass-card rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">{heading}</h1>
            <p className="text-muted-foreground text-sm">{subcopy}</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-secondary transition-colors text-foreground text-sm font-medium mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLabel}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={mode === "signup" ? 6 : undefined}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border"
                />
                Remember me
              </label>
              {mode === "signin" && (
                <button type="button" className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg gradient-gold text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Loading..." : submitLabel}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{togglePrompt}</span>{" "}
            <Link to={toggleHref} className="text-primary font-medium hover:underline">
              {toggleCta}
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
