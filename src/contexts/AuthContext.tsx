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
  // True once we have BOTH the session resolved AND (if signed in) the profile fetched.
  // Auth guards should wait on this to avoid flashing a redirect while the role loads.
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string): Promise<AuthProfile | null> => {
    try {
      // role is a new column; cast to any to bypass the checked-in generated types
      // until the next types regen. Other columns remain strongly typed.
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();
      if (error) {
        console.error("[auth] profile fetch failed", error);
        return null;
      }
      if (!data) return { id: userId, role: null };
      return { id: data.id as string, role: (data.role ?? null) as UserRole | null };
    } catch (err) {
      console.error("[auth] profile fetch exception", err);
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
    // Rely on onAuthStateChange — Supabase fires INITIAL_SESSION exactly once
    // AFTER it finishes processing any OAuth code/token in the URL.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // ── OAuth callback debugging ──
        // eslint-disable-next-line no-console
        console.log("[oauth-debug] onAuthStateChange fired", {
          event,
          hasSession: !!newSession,
          userId: newSession?.user?.id ?? null,
          userEmail: newSession?.user?.email ?? null,
          provider: newSession?.user?.app_metadata?.provider ?? null,
          expiresAt: newSession?.expires_at ?? null,
          urlAtFire: typeof window !== "undefined" ? window.location.href : null,
        });

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (newSession?.user) {
          setProfileLoading(true);
          const fresh = await fetchProfile(newSession.user.id);
          // eslint-disable-next-line no-console
          console.log("[oauth-debug] profile fetched after auth event", { event, profile: fresh });
          setProfile(fresh);
          setProfileLoading(false);
        } else {
          setProfile(null);
          setProfileLoading(false);
        }
      }
    );

    // Extra belt-and-suspenders: immediately read the current session at
    // mount and log what we see, without touching state (onAuthStateChange
    // remains the source of truth).
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // eslint-disable-next-line no-console
      console.log("[oauth-debug] getSession on mount", {
        hasSession: !!session,
        userId: session?.user?.id ?? null,
        error: error?.message ?? null,
        url: typeof window !== "undefined" ? window.location.href : null,
      });
    });

    return () => subscription.unsubscribe();
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
