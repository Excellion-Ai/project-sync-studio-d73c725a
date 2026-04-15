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
        console.error("[auth] profile fetch failed", error);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (newSession?.user) {
          setProfileLoading(true);
          const fresh = await fetchProfile(newSession.user.id);
          setProfile(fresh);
          setProfileLoading(false);
        } else {
          setProfile(null);
          setProfileLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      console.log("[auth] getSession on mount", { hasSession: !!s });
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
