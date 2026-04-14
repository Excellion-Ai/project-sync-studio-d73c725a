import posthog from "posthog-js";

// ── Analytics event names ──────────────────────────────────
export const ANALYTICS_EVENTS = {
  USER_SIGNED_UP: "user_signed_up",
  COURSE_GENERATED: "course_generated",
  PRICING_PAGE_VIEWED: "pricing_page_viewed",
  PUBLISH_BUTTON_CLICKED: "publish_button_clicked",
} as const;

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  try {
    posthog.identify(userId, traits);
  } catch (err) {
    console.error("[analytics] identify failed", err);
  }
}

export function resetAnalytics() {
  try {
    posthog.reset();
  } catch (err) {
    console.error("[analytics] reset failed", err);
  }
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch (err) {
    console.error("[analytics] track failed", event, err);
  }
}

// ── Convenience wrappers ────────────────────────────────────
export const analytics = {
  signedUp: (props?: { method?: string; email?: string }) =>
    trackEvent(ANALYTICS_EVENTS.USER_SIGNED_UP, props),
  courseGenerated: (props?: { title?: string; module_count?: number; has_pdf?: boolean; duration_weeks?: number }) =>
    trackEvent(ANALYTICS_EVENTS.COURSE_GENERATED, props),
  pricingPageViewed: (props?: { source?: string }) =>
    trackEvent(ANALYTICS_EVENTS.PRICING_PAGE_VIEWED, props),
  publishClicked: (props?: { course_id?: string; course_title?: string }) =>
    trackEvent(ANALYTICS_EVENTS.PUBLISH_BUTTON_CLICKED, props),
};
