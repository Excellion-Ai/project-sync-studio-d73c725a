import { useState, useEffect, useCallback, useRef } from "react";
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

const FOUNDER_EMAILS = ["excellionai@gmail.com"];
const SUB_TIMEOUT_MS = 5000;

// Module-level cache so multiple components mounting useSubscription
// don't each fire their own check-subscription request in a loop.
type CacheEntry = { data: Omit<SubscriptionState, "loading">; ts: number };
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<Omit<SubscriptionState, "loading">>>();
const CACHE_TTL_MS = 60_000; // 1 min

const FOUNDER_RESULT: Omit<SubscriptionState, "loading"> = {
  subscribed: true,
  status: "active",
  productId: null,
  priceId: null,
  subscriptionEnd: null,
  cancelAtPeriodEnd: false,
};

const UNSUB_RESULT: Omit<SubscriptionState, "loading"> = {
  subscribed: false,
  status: null,
  productId: null,
  priceId: null,
  subscriptionEnd: null,
  cancelAtPeriodEnd: false,
};

async function fetchSubscription(userKey: string): Promise<Omit<SubscriptionState, "loading">> {
  // De-dupe concurrent calls
  const existing = inflight.get(userKey);
  if (existing) return existing;

  const promise = (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return UNSUB_RESULT;

    // 5s timeout — if check-subscription stalls, default to unsubscribed
    // (callers gate access with explicit founder bypass).
    const invokePromise = supabase.functions.invoke("check-subscription");
    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error("subscription check timeout") }), SUB_TIMEOUT_MS)
    );

    const { data, error } = (await Promise.race([invokePromise, timeoutPromise])) as any;

    if (error || !data) {
      console.warn("[useSubscription] falling back to unsubscribed:", error?.message);
      return UNSUB_RESULT;
    }

    return {
      subscribed: data?.subscribed ?? false,
      status: data?.status ?? null,
      productId: data?.product_id ?? null,
      priceId: data?.price_id ?? null,
      subscriptionEnd: data?.subscription_end ?? null,
      cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    };
  })();

  inflight.set(userKey, promise);
  try {
    const result = await promise;
    cache.set(userKey, { data: result, ts: Date.now() });
    return result;
  } finally {
    inflight.delete(userKey);
  }
}

export function useSubscription() {
  const { user } = useAuth();
  const userKey = user?.id ?? "anon";
  const isFounder = !!user?.email && FOUNDER_EMAILS.includes(user.email);

  const [state, setState] = useState<SubscriptionState>(() => {
    if (!user) return { ...UNSUB_RESULT, loading: false };
    if (isFounder) return { ...FOUNDER_RESULT, loading: false };
    const cached = cache.get(userKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return { ...cached.data, loading: false };
    }
    return { ...UNSUB_RESULT, loading: true };
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async (force = false) => {
    if (!user) {
      setState({ ...UNSUB_RESULT, loading: false });
      return;
    }
    if (isFounder) {
      setState({ ...FOUNDER_RESULT, loading: false });
      return;
    }
    if (!force) {
      const cached = cache.get(userKey);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        setState({ ...cached.data, loading: false });
        return;
      }
    } else {
      cache.delete(userKey);
    }
    setState((s) => ({ ...s, loading: true }));
    const result = await fetchSubscription(userKey);
    if (mountedRef.current) setState({ ...result, loading: false });
  }, [user, isFounder, userKey]);

  // Run ONCE per user change — not on every render.
  useEffect(() => {
    refresh(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey, isFounder]);

  const openPortal = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke(
      "create-portal-session",
      { body: { return_url: window.location.href } }
    );
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
    else throw new Error("No portal URL returned");
  }, []);

  const startCheckout = useCallback(async (plan: "monthly" | "annual" = "monthly") => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { plan },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
    else throw new Error("No checkout URL returned");
  }, []);

  return { ...state, refresh: () => refresh(true), openPortal, startCheckout };
}
