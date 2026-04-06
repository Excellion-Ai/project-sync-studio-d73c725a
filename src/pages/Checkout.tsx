import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const courseId = searchParams.get("course");
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setError("No course specified.");
      setLoading(false);
      return;
    }
    if (!user) {
      navigate(`/auth?redirect=/checkout?course=${courseId}`);
      return;
    }

    const startCheckout = async () => {
      try {
        // Fetch course info for display
        const { data: courseData } = await supabase
          .from("courses")
          .select("id, title, price_cents, currency, is_free, slug, thumbnail_url")
          .eq("id", courseId)
          .single();

        if (!courseData) {
          setError("Course not found.");
          setLoading(false);
          return;
        }

        setCourse(courseData);

        if (courseData.is_free || !courseData.price_cents || courseData.price_cents <= 0) {
          // Free course — just enroll directly
          const { error: enrollError } = await supabase
            .from("enrollments")
            .insert({ course_id: courseId, user_id: user.id });
          if (enrollError && enrollError.code !== "23505") {
            toast.error("Failed to enroll.");
            setLoading(false);
            return;
          }
          toast.success("Enrolled successfully!");
          navigate(`/learn/${courseData.slug || courseId}`);
          return;
        }

        // Paid course — create checkout session
        const { data, error: fnError } = await supabase.functions.invoke("create-course-checkout", {
          body: { course_id: courseId },
        });

        if (fnError || data?.error) {
          setError(data?.error || fnError?.message || "Failed to create checkout");
          setLoading(false);
          return;
        }

        if (data?.url) {
          window.location.href = data.url;
        } else {
          setError("No checkout URL returned.");
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
        setLoading(false);
      }
    };

    startCheckout();
  }, [courseId, user, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <main className="pt-24 pb-16 px-4 flex items-center justify-center min-h-[80vh]">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-2xl font-heading font-bold">Checkout Error</h1>
            <p className="text-muted-foreground font-body">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-[10px] bg-primary text-primary-foreground text-sm font-body hover:opacity-90 transition-opacity"
            >
              Go Back
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-body">
            {course ? `Redirecting to checkout for "${course.title}"...` : "Preparing checkout..."}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
