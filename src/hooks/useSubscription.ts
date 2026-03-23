import { useState, useCallback } from "react";

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

/**
 * Stub hook — subscription infrastructure (table + edge function) not yet built.
 * Returns subscribed: false and a no-op refresh.
 * Replace with real logic once a subscriptions table + Stripe webhook exists.
 */
export function useSubscription() {
  const [state] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    loading: false,
  });

  const refresh = useCallback(async () => {
    // No-op until subscription infrastructure is built
  }, []);

  return { ...state, refresh };
}
