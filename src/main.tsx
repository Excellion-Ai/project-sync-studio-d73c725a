import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { PostHogProvider } from "@posthog/react";
import App from "./App.tsx";
import "./index.css";

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
