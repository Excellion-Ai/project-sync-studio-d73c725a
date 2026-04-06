import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const PurchaseSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const sessionId = searchParams.get("session_id");
  const courseId = searchParams.get("course_id");

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!sessionId || !courseId || !user) return;

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-course-purchase", {
          body: { session_id: sessionId, course_id: courseId },
        });

        if (error || data?.error) {
          setErrorMsg(data?.error || error?.message || "Verification failed");
          setStatus("error");
          return;
        }

        setCourseSlug(data.course_slug || null);
        setStatus("success");
      } catch (err: any) {
        setErrorMsg(err.message || "Unexpected error");
        setStatus("error");
      }
    };

    verify();
  }, [sessionId, courseId, user]);

  // Auto-redirect countdown after success
  useEffect(() => {
    if (status !== "success") return;
    if (countdown <= 0) {
      navigate(courseSlug ? `/learn/${courseSlug}` : "/my-courses");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, navigate, courseSlug]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          {status === "verifying" && (
            <>
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <h1 className="text-2xl font-heading font-bold">Verifying Your Purchase...</h1>
              <p className="text-muted-foreground font-body">Please wait while we confirm your payment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-heading font-bold">Purchase Successful!</h1>
              <p className="text-muted-foreground font-body">
                You're now enrolled. Start learning right away!
              </p>
              <div className="text-sm text-muted-foreground font-body">
                Redirecting in {countdown} seconds...
              </div>
              <button
                onClick={() => navigate(courseSlug ? `/learn/${courseSlug}` : "/my-courses")}
                className="px-6 py-3 rounded-[10px] bg-primary text-primary-foreground text-sm font-body hover:opacity-90 transition-opacity"
              >
                Start Learning Now
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-heading font-bold">Something Went Wrong</h1>
              <p className="text-muted-foreground font-body">{errorMsg}</p>
              <button
                onClick={() => navigate("/my-courses")}
                className="px-6 py-3 rounded-[10px] bg-primary text-primary-foreground text-sm font-body hover:opacity-90 transition-opacity"
              >
                Go to My Courses
              </button>
            </>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default PurchaseSuccess;
