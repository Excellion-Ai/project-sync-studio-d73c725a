import { supabase } from "@/integrations/supabase/client";
import type { UserRole } from "@/contexts/AuthContext";

export const destinationForRole = (_role: UserRole): string => "/dashboard";

/**
 * Fetch the `role` column from the profiles table.
 * Returns `null` if the row exists but has no role set (new user) OR if the
 * row is missing (trigger race — caller should treat as "no role yet").
 */
export async function fetchRoleForUser(userId: string): Promise<UserRole | null> {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[roleRouting] fetchRoleForUser failed", error);
    return null;
  }
  const role = (data?.role ?? null) as UserRole | null;
  return role;
}
