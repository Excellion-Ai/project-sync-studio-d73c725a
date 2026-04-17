import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export type UserRole = "coach" | "student";

export interface AuthProfile {
  id: string;
  role: UserRole | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: AuthProfile | null;
  role: UserRole | null;
  loading: boolean;
  ready: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  ready: false,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

/**
 * Auto-assign "coach" role to a profile that has no role set yet.
 * This replaces the old role-selection onboarding page.
 */
async function ensureCoachRole(userId: string): Promise<UserRole> {
  try {
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ role: "coach", updated_at: new Date().toISOString() })
      .eq("id", userId)
      .is("role", null);
    if (error) console.error("[auth] ensureCoachRole update failed", error);
  } catch (err) {
    console.error("[auth] ensureCoachRole exception", err);
  }
  return "coach";
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string): Promise<AuthProfile | null> => {
    try {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();
      if (error) {
        console.error("[auth-ctx] profile fetch failed", error);
        return null;
      }
      if (!data) return { id: userId, role: null };
      let role = (data.role ?? null) as UserRole | null;

      // Auto-assign coach role for new users with no role
      if (!role) {
        role = await ensureCoachRole(userId);
      }

      return { id: data.id as string, role };
    } catch (err) {
      console.error("[auth-ctx] profile fetch exception", err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    const fresh = await fetchProfile(user.id);
    setProfile(fresh);
    setProfileLoading(false);
  }, [user, fetchProfile]);

  useEffect(() => {
    let resolved = false;

    const handleSession = async (newSession: Session | null) => {
      resolved = true;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (newSession?.user) {
        setProfileLoading(true);
        try {
          // 3s timeout on profile fetch — if the Supabase query hangs
          // (dead JWT, network), assume coach and let the user through.
          const fresh = await Promise.race([
            fetchProfile(newSession.user.id),
            new Promise<AuthProfile>((resolve) =>
              setTimeout(() => {
                // eslint-disable-next-line no-console
                console.warn("[auth-ctx] profile fetch timed out after 3s — defaulting to coach");
                resolve({ id: newSession.user.id, role: "coach" });
              }, 3000)
            ),
          ]);
          setProfile(fresh ?? { id: newSession.user.id, role: "coach" });
        } catch {
          setProfile({ id: newSession.user.id, role: "coach" });
        }
        setProfileLoading(false);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    };

    // onAuthStateChange fires INITIAL_SESSION once the SDK has read +
    // validated the stored session. This is the primary path.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        // eslint-disable-next-line no-console
        console.log("[auth-ctx] onAuthStateChange", { event: _event, hasSession: !!newSession });
        await handleSession(newSession);
      }
    );

    // Hard 5-second timeout: if onAuthStateChange hasn't fired (dead
    // JWT, stalled token refresh, Supabase SDK bug), read the session
    // from localStorage directly and force-resolve loading. Without
    // this, the entire app shows an infinite spinner.
    const timeout = setTimeout(async () => {
      if (resolved) return;
      // eslint-disable-next-line no-console
      console.warn("[auth-ctx] onAuthStateChange stalled after 5s — falling back to getSession()");
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!resolved) {
          // eslint-disable-next-line no-console
          console.log("[auth-ctx] getSession fallback →", { hasSession: !!s, userId: s?.user?.id ?? null });
          await handleSession(s);
        }
      } catch {
        // eslint-disable-next-line no-console
        console.error("[auth-ctx] getSession fallback threw — forcing loading=false with no user");
        if (!resolved) {
          resolved = true;
          setLoading(false);
        }
      }
    }, 5000);

    // Absolute hard stop: if NOTHING resolved after 8 seconds,
    // force loading=false. Guards will see user=null and redirect
    // to /auth. The user gets a sign-in page rather than a black screen.
    const hardStop = setTimeout(() => {
      if (!resolved) {
        // eslint-disable-next-line no-console
        console.error("[auth-ctx] 8s hard stop — forcing loading=false");
        resolved = true;
        setLoading(false);
      }
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
      clearTimeout(hardStop);
    };
  }, [fetchProfile]);

  const ready = !loading && (!user || !profileLoading);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role: profile?.role ?? null,
        loading,
        ready,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
