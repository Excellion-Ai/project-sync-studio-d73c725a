import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { PostHogProvider } from "@posthog/react";
import App from "./App.tsx";
import "./index.css";

// ── OAuth callback debugging ──────────────────────────────
// Runs once on boot, BEFORE Supabase strips the URL, so we can see the
// raw redirect URL that Google/Supabase handed us. Grouped so it's easy
// to find in devtools.
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.groupCollapsed("[oauth-debug] page load");
  // eslint-disable-next-line no-console
  console.log("href:", window.location.href);
  // eslint-disable-next-line no-console
  console.log("origin:", window.location.origin);
  // eslint-disable-next-line no-console
  console.log("pathname:", window.location.pathname);
  // eslint-disable-next-line no-console
  console.log("search:", window.location.search);
  // eslint-disable-next-line no-console
  console.log("hash:", window.location.hash);
  const sp = new URLSearchParams(window.location.search);
  // eslint-disable-next-line no-console
  console.log("query params:", Object.fromEntries(sp.entries()));
  const hp = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  // eslint-disable-next-line no-console
  console.log("hash params:", Object.fromEntries(hp.entries()));
  // eslint-disable-next-line no-console
  console.log("has ?code=:", sp.has("code"));
  // eslint-disable-next-line no-console
  console.log("has ?error=:", sp.has("error"));
  // eslint-disable-next-line no-console
  console.log("has #access_token=:", hp.has("access_token"));
  // eslint-disable-next-line no-console
  console.groupEnd();
}

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

const posthogOptions = {
  api_host: POSTHOG_HOST,
  person_profiles: "identified_only" as const,
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: false,
};

const AppTree = (
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);

createRoot(document.getElementById("root")!).render(
  POSTHOG_KEY ? (
    <PostHogProvider apiKey={POSTHOG_KEY} options={posthogOptions}>
      {AppTree}
    </PostHogProvider>
  ) : (
    AppTree
  )
);
