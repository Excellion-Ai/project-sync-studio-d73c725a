import { useEffect, useState } from "react";
import { useLocation, useParams, Navigate } from "react-router-dom";
import { toast } from "sonner";
import BuilderShell from "@/components/secret-builder/BuilderShell";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

const FOUNDER_EMAIL = "excellionai@gmail.com";

const SecretBuilder = () => {
  const location = useLocation();
  const { projectId: paramProjectId } = useParams<{ projectId: string }>();
  const { user, ready, role } = useAuth();
  const { subscribed, loading: subLoading } = useSubscription();
  const [forceRender, setForceRender] = useState(false);

  // Hard 10s safety net so we never get stuck on the spinner.
  useEffect(() => {
    if (forceRender) return;
    const t = setTimeout(() => {
      setForceRender(true);
      toast.warning("Taking longer than expected — loading may be incomplete.");
    }, 10000);
    return () => clearTimeout(t);
  }, [forceRender]);

  const stillLoading = (!ready || (user && subLoading)) && !forceRender;
  if (stillLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!role) return <Navigate to="/onboarding/role" replace />;
  if (role === "student") return <Navigate to="/dashboard/student" replace />;
  if (!subscribed && user.email !== FOUNDER_EMAIL) {
    return <Navigate to="/paywall" replace />;
  }

  // Extract navigation state passed from SecretBuilderHub
  const state = (location.state as {
    initialIdea?: string;
    projectId?: string;
    templateSpec?: any;
    courseMode?: string;
    courseId?: string;
    pdfBase64?: string;
    pdfName?: string;
  }) || {};

  const resolvedProjectId = paramProjectId || state.projectId || null;

  // PDF data: router state is primary, sessionStorage is fallback
  const pdfBase64 = state.pdfBase64 || sessionStorage.getItem("builder-pdf-base64") || undefined;
  const pdfName = state.pdfName || sessionStorage.getItem("builder-pdf-name") || undefined;
  // Clean up sessionStorage after reading (one-time use)
  if (pdfBase64) {
    sessionStorage.removeItem("builder-pdf-base64");
    sessionStorage.removeItem("builder-pdf-name");
  }

  return (
    <div className="min-h-screen">
      <BuilderShell
        key={resolvedProjectId || state.courseId || "new"}
        initialIdea={state.initialIdea}
        initialProjectId={resolvedProjectId}
        initialCourseId={state.courseId}
        templateSpec={state.templateSpec}
        courseMode={state.courseMode}
        initialPdfBase64={pdfBase64}
        initialPdfName={pdfName}
      />
    </div>
  );
};

export default SecretBuilder;
