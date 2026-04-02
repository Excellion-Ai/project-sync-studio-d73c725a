import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionState {
  subscribed: boolean;
  status: string | null;
  productId: string | null;
  priceId: string | null;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    status: null,
    productId: null,
    priceId: null,
    subscriptionEnd: null,
    cancelAtPeriodEnd: false,
    loading: true,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setState((s) => ({ ...s, loading: false, subscribed: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) {
        console.error("check-subscription error:", error);
        setState((s) => ({ ...s, loading: false, subscribed: false }));
        return;
      }

      setState({
        subscribed: data?.subscribed ?? false,
        status: data?.status ?? null,
        productId: data?.product_id ?? null,
        priceId: data?.price_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
        loading: false,
      });
    } catch {
      setState((s) => ({ ...s, loading: false, subscribed: false }));
    }
  }, []);

  const openPortal = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke(
      "create-portal-session",
      { body: { return_url: window.location.href } }
    );
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No portal URL returned");
    }
  }, []);

  const startCheckout = useCallback(async (plan: "monthly" | "annual" = "monthly") => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { plan },
    });
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No checkout URL returned");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, user]);

  // Refresh on window focus (not polling — avoids 404 spam)
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return { ...state, refresh, openPortal, startCheckout };
}
