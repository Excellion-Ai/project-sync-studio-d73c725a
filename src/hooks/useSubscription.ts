import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionState {
  subscribed: boolean;
  status: string | null;
  planName: string | null;
  priceCents: number | null;
  currency: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  loading: boolean;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    status: null,
    planName: null,
    priceCents: null,
    currency: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    stripeCustomerId: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setState((s) => ({ ...s, loading: false, subscribed: false }));
      return;
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      setState((s) => ({ ...s, loading: false, subscribed: false }));
      return;
    }

    setState({
      subscribed: data.status === "active" || data.status === "trialing",
      status: data.status,
      planName: data.plan_name,
      priceCents: data.price_cents,
      currency: data.currency,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
      stripeCustomerId: data.stripe_customer_id,
      loading: false,
    });
  }, []);

  const openPortal = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke(
      "create-portal-session",
      { body: { return_url: window.location.href } },
    );
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No portal URL returned");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh, openPortal };
}
