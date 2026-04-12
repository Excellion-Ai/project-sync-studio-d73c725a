import { useLocation, useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BuilderShell from "@/components/secret-builder/BuilderShell";

const ALLOWED_EMAIL = "excellionai@gmail.com";

const SecretBuilder = () => {
  const location = useLocation();
  const { projectId: paramProjectId } = useParams<{ projectId: string }>();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      // Allow founder email OR any authenticated user (subscription checked elsewhere)
      setIsAllowed(!!session);
      setAuthChecked(true);
    });
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isAllowed) {
    return <Navigate to="/auth" replace />;
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

  return (
    <div className="min-h-screen">
      <BuilderShell
        key={resolvedProjectId || state.courseId || "new"}
        initialIdea={state.initialIdea}
        initialProjectId={resolvedProjectId}
        initialCourseId={state.courseId}
        templateSpec={state.templateSpec}
        courseMode={state.courseMode}
        initialPdfBase64={state.pdfBase64}
        initialPdfName={state.pdfName}
      />
    </div>
  );
};

export default SecretBuilder;
