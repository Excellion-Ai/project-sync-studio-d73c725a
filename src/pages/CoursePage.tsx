import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExtendedCourse, ModuleWithContent } from "@/types/course-pages";
import CourseLandingPreview from "@/components/secret-builder/CourseLandingPreview";
import { toast } from "sonner";

const CoursePage = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<ExtendedCourse | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!subdomain) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const fetchCourse = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("subdomain", subdomain)
        .eq("status", "published")
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setCourseId(data.id);

      const modules: ModuleWithContent[] = Array.isArray(data.curriculum)
        ? (data.curriculum as unknown as ModuleWithContent[])
        : [];

      const extended: ExtendedCourse = {
        id: data.id,
        title: data.title,
        description: data.description ?? "",
        tagline: data.tagline ?? undefined,
        difficulty: "all-levels",
        duration_weeks: Math.max(1, modules.length),
        modules,
        learningOutcomes: (data.meta as any)?.learningOutcomes ?? [],
        thumbnail: data.thumbnail_url ?? undefined,
        brand_color: (data.branding as any)?.primary_color ?? undefined,
        layout_style: (data.design_config as any)?.layoutStyle ?? "creator",
        design_config: data.design_config as any,
        layout_template: data.layout_template ?? undefined,
        section_order: Array.isArray(data.section_order)
          ? (data.section_order as string[])
          : undefined,
        pages: {
          landing_sections: Array.isArray(data.section_order)
            ? (data.section_order as any)
            : ["hero", "outcomes", "curriculum", "instructor", "pricing", "faq"],
          instructor: data.instructor_name
            ? { name: data.instructor_name, bio: data.instructor_bio ?? "" }
            : undefined,
          pricing:
            data.price_cents != null
              ? {
                  price: data.price_cents / 100,
                  currency: data.currency ?? "USD",
                }
              : undefined,
          faq: (data.meta as any)?.faq ?? [],
          target_audience: (data.meta as any)?.target_audience,
          included_bonuses: (data.meta as any)?.included_bonuses,
        },
      };

      setCourse(extended);
      setIsLoading(false);
    };

    fetchCourse();
  }, [subdomain]);

  const handleEnroll = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth", { state: { redirect: `/course/${subdomain}` } });
      return;
    }
    if (!courseId) return;

    // Check existing enrollment
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", courseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      toast.info("You're already enrolled!");
      navigate(`/learn/${subdomain}`);
      return;
    }

    const { error } = await supabase.from("enrollments").insert({
      course_id: courseId,
      user_id: user.id,
    });

    if (error) {
      toast.error("Failed to enroll. Please try again.");
      return;
    }

    toast.success("Enrolled successfully!");
    navigate(`/learn/${subdomain}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold">Course Not Found</h1>
        <p className="text-muted-foreground">
          This course doesn't exist or hasn't been published yet.
        </p>
        <button
          onClick={() => navigate("/")}
          className="text-primary underline"
        >
          Go Home
        </button>
      </div>
    );
  }

  return <CourseLandingPreview course={course} onEnrollClick={handleEnroll} />;
};

export default CoursePage;
