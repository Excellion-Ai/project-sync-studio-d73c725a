import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
const WebBuilderHome = lazyWithRetry(() => import("./pages/WebBuilderHome"), "WebBuilderHome");
const Auth = lazyWithRetry(() => import("./pages/Auth"), "Auth");
const AuthCallback = lazyWithRetry(() => import("./pages/AuthCallback"), "AuthCallback");
const SecretBuilderHub = lazyWithRetry(() => import("./pages/SecretBuilderHub"), "SecretBuilderHub");
const SecretBuilder = lazyWithRetry(() => import("./pages/SecretBuilder"), "SecretBuilder");
const CoursePage = lazyWithRetry(() => import("./pages/CoursePage"), "CoursePage");
const CoursesPage = lazyWithRetry(() => import("./pages/CoursesPage"), "CoursesPage");
const MyCourses = lazyWithRetry(() => import("./pages/MyCourses"), "MyCourses");
const LearnPage = lazyWithRetry(() => import("./pages/LearnPage"), "LearnPage");
const CertificatePage = lazyWithRetry(() => import("./pages/CertificatePage"), "CertificatePage");
const PurchaseSuccess = lazyWithRetry(() => import("./pages/PurchaseSuccess"), "PurchaseSuccess");
const StudentDashboard = lazyWithRetry(() => import("./pages/StudentDashboard"), "StudentDashboard");
const CreatorAnalytics = lazyWithRetry(() => import("./pages/CreatorAnalytics"), "CreatorAnalytics");
const CourseDetailAnalytics = lazyWithRetry(() => import("./pages/CourseDetailAnalytics"), "CourseDetailAnalytics");
const Billing = lazyWithRetry(() => import("./pages/Billing"), "Billing");
const Checkout = lazyWithRetry(() => import("./pages/Checkout"), "Checkout");
const CheckoutSuccess = lazyWithRetry(() => import("./pages/CheckoutSuccess"), "CheckoutSuccess");
const Admin = lazyWithRetry(() => import("./pages/Admin"), "Admin");
const AdminCourses = lazyWithRetry(() => import("./pages/AdminCourses"), "AdminCourses");
const Privacy = lazyWithRetry(() => import("./pages/Privacy"), "Privacy");
const Terms = lazyWithRetry(() => import("./pages/Terms"), "Terms");
const About = lazyWithRetry(() => import("./pages/About"), "About");
const Contact = lazyWithRetry(() => import("./pages/Contact"), "Contact");
const FAQ = lazyWithRetry(() => import("./pages/FAQ"), "FAQ");
const Legal = lazyWithRetry(() => import("./pages/Legal"), "Legal");
const BuilderPricing = lazyWithRetry(() => import("./pages/BuilderPricing"), "BuilderPricing");
const Paywall = lazyWithRetry(() => import("./pages/Paywall"), "Paywall");
const BuilderFAQ = lazyWithRetry(() => import("./pages/BuilderFAQ"), "BuilderFAQ");
const ThankYou = lazyWithRetry(() => import("./pages/ThankYou"), "ThankYou");
const MaintenanceRequest = lazyWithRetry(() => import("./pages/MaintenanceRequest"), "MaintenanceRequest");
const BuilderTest = lazyWithRetry(() => import("./pages/BuilderTest"), "BuilderTest");
const Founding = lazyWithRetry(() => import("./pages/Founding"), "Founding");
const NotFound = lazyWithRetry(() => import("./pages/NotFound"), "NotFound");

// Onboarding
const RoleSelection = lazyWithRetry(() => import("./pages/onboarding/RoleSelection"), "RoleSelection");

// Settings
const Settings = lazyWithRetry(() => import("./pages/Settings"), "Settings");
const ProfileSettings = lazyWithRetry(() => import("./pages/settings/ProfileSettings"), "ProfileSettings");
const BillingSettings = lazyWithRetry(() => import("./pages/settings/BillingSettings"), "BillingSettings");
const NotificationsSettings = lazyWithRetry(() => import("./pages/settings/NotificationsSettings"), "NotificationsSettings");
const WorkspaceSettings = lazyWithRetry(() => import("./pages/settings/WorkspaceSettings"), "WorkspaceSettings");
const TeamSettings = lazyWithRetry(() => import("./pages/settings/TeamSettings"), "TeamSettings");
const DomainsSettings = lazyWithRetry(() => import("./pages/settings/DomainsSettings"), "DomainsSettings");
const KnowledgeSettings = lazyWithRetry(() => import("./pages/settings/KnowledgeSettings"), "KnowledgeSettings");
const AppearanceSettings = lazyWithRetry(() => import("./pages/settings/AppearanceSettings"), "AppearanceSettings");
const ShortcutsSettings = lazyWithRetry(() => import("./pages/settings/ShortcutsSettings"), "ShortcutsSettings");
const HelpSettings = lazyWithRetry(() => import("./pages/settings/HelpSettings"), "HelpSettings");
const SupportSettings = lazyWithRetry(() => import("./pages/settings/SupportSettings"), "SupportSettings");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Core */}
            <Route path="/" element={<WebBuilderHome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dashboard" element={<SecretBuilderHub />} />
            <Route path="/secret-builder-hub" element={<SecretBuilderHub />} />
            {/* /onboarding/role removed — coaches are auto-assigned */}
            <Route path="/secret-builder" element={<SecretBuilder />} />
            <Route path="/secret-builder/:projectId" element={<SecretBuilder />} />
            <Route path="/studio/:projectId" element={<SecretBuilder />} />

            {/* LMS */}
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/course/:slug" element={<CoursePage />} />
            <Route path="/learn/:slug" element={<LearnPage />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/certificate/:id" element={<CertificatePage />} />
            <Route path="/purchase-success" element={<PurchaseSuccess />} />
            <Route path="/dashboard/student" element={<StudentDashboard />} />
            <Route path="/dashboard/analytics" element={<CreatorAnalytics />} />
            <Route path="/dashboard/analytics/:courseId" element={<CourseDetailAnalytics />} />

            {/* Business */}
            <Route path="/billing" element={<Billing />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/pricing" element={<BuilderPricing />} />
            <Route path="/paywall" element={<Paywall />} />

            {/* Admin */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/courses" element={<AdminCourses />} />

            {/* Static */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/builder-faq" element={<BuilderFAQ />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/founding" element={<Founding />} />
            <Route path="/maintenance-request" element={<MaintenanceRequest />} />
            <Route path="/builder-test" element={<BuilderTest />} />

            {/* Settings */}
            <Route path="/settings" element={<Settings />}>
              <Route index element={<ProfileSettings />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="billing" element={<BillingSettings />} />
              <Route path="notifications" element={<NotificationsSettings />} />
              <Route path="workspace" element={<WorkspaceSettings />} />
              <Route path="team" element={<TeamSettings />} />
              <Route path="knowledge" element={<KnowledgeSettings />} />
              <Route path="domains" element={<DomainsSettings />} />
              <Route path="appearance" element={<AppearanceSettings />} />
              <Route path="shortcuts" element={<ShortcutsSettings />} />
              <Route path="help" element={<HelpSettings />} />
              <Route path="support" element={<SupportSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
