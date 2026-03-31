import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import DynamicCoursePreview from "@/components/secret-builder/visual-editing/DynamicCoursePreview";
import type { ExtendedCourse, ModuleWithContent, LessonContent } from "@/types/course-pages";

// ── Mapping helper ──────────────────────────────────────────

function mapRowToExtendedCourse(row: any): ExtendedCourse {
  // Parse curriculum → modules
  const rawModules = Array.isArray(row.curriculum) ? row.curriculum : [];
  const modules: ModuleWithContent[] = rawModules.map((mod: any, i: number) => ({
    id: mod.id || `mod-${i}`,
    title: mod.title || `Module ${i + 1}`,
    description: mod.description || "",
    lessons: Array.isArray(mod.lessons)
      ? mod.lessons.map((l: any, j: number): LessonContent => ({
          id: l.id || `les-${i}-${j}`,
          title: l.title || `Lesson ${j + 1}`,
          duration: l.duration || "",
          type: l.type || "text",
          description: l.description,
          is_preview: l.is_preview,
          content_markdown: l.content_markdown,
          video_url: l.video_url,
          quiz_questions: l.quiz_questions,
          passing_score: l.passing_score,
          assignment_brief: l.assignment_brief,
          resources: l.resources,
        }))
      : [],
    has_quiz: mod.has_quiz,
    has_assignment: mod.has_assignment,
    total_duration: mod.total_duration,
    layout_variant: mod.layout_variant,
  }));

  const pageSections = (row.page_sections as any) || {};

  return {
    id: row.id,
    title: row.title || "",
    description: row.description || "",
    tagline: row.tagline,
    difficulty: (row.meta as any)?.difficulty || "All Levels",
    duration_weeks: (row.meta as any)?.duration_weeks || 0,
    modules,
    learningOutcomes: (row.meta as any)?.learningOutcomes || pageSections?.learningOutcomes,
    thumbnail: row.thumbnail_url,
    brand_color: (row.branding as any)?.primary,
    design_config: row.design_config as any,
    layout_template: row.layout_template,
    section_order: Array.isArray(row.section_order) ? row.section_order : undefined,
    pages: {
      landing_sections: pageSections?.landing_sections || [
        "hero", "outcomes", "curriculum", "instructor", "pricing", "faq",
      ],
      faq: pageSections?.faq,
      instructor: pageSections?.instructor || (row.instructor_name ? {
        name: row.instructor_name,
        bio: row.instructor_bio || "",
      } : undefined),
      pricing: pageSections?.pricing || {
        price: row.is_free ? 0 : (row.price_cents || 0) / 100,
        currency: row.currency || "USD",
        original_price: pageSections?.pricing?.original_price,
      },
      target_audience: pageSections?.target_audience,
      show_guarantee: pageSections?.show_guarantee,
      included_bonuses: pageSections?.included_bonuses,
    },
    layout_style: (row.meta as any)?.layout_style || "creator",
  };
}

function formatPrice(cents: number | null, currency: string | null, isFree: boolean | null): string {
  if (isFree || !cents || cents === 0) return "Free";
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: (currency || "USD").toUpperCase() }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

// ── Component ───────────────────────────────────────────────

const CoursePage = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [isOwnerPreview, setIsOwnerPreview] = useState(false);

  // ── Fetch ────────────────────────────────────────────────

  const PUBLIC_COURSE_COLUMNS = "id,title,description,tagline,slug,subdomain,curriculum,design_config,layout_template,section_order,section_config,page_sections,meta,status,is_free,price_cents,currency,thumbnail_url,hero_copy,instructor_name,instructor_bio,seo_title,seo_description,social_image_url,type,total_students,branding,created_at,updated_at,published_at,deleted_at,has_video_content,is_featured,custom_domain,domain_verified,original_prompt,builder_project_id";

  useEffect(() => {
    if (!subdomain) { setNotFound(true); setIsLoading(false); return; }

    const fetchCourse = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const findOne = async (q: any) => { const { data: rows } = await q; return rows?.[0] ?? null; };

      let row: any = null;
      let ownerPreview = false;

      row = await findOne(supabase.from("courses").select(PUBLIC_COURSE_COLUMNS).eq("subdomain", subdomain).eq("status", "published").is("deleted_at", null).limit(1));

      if (!row && user) {
        row = await findOne(supabase.from("courses").select(PUBLIC_COURSE_COLUMNS).eq("subdomain", subdomain).eq("user_id", user.id).is("deleted_at", null).limit(1));
        if (row) ownerPreview = true;
      }

      if (!row && subdomain.match(/^[0-9a-f-]{36}$/i)) {
        row = await findOne(supabase.from("courses").select(PUBLIC_COURSE_COLUMNS).eq("id", subdomain).eq("status", "published").is("deleted_at", null).limit(1));
        if (!row && user) {
          row = await findOne(supabase.from("courses").select(PUBLIC_COURSE_COLUMNS).eq("id", subdomain).eq("user_id", user.id).is("deleted_at", null).limit(1));
          if (row) ownerPreview = true;
        }
      }

      if (!row) { setNotFound(true); setIsLoading(false); return; }

      setIsOwnerPreview(ownerPreview);

      if (!ownerPreview) {
        supabase.from("course_views").insert({ course_id: row.id, device_type: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop", referrer: document.referrer || null });
      }

      setCourse(row);
      setIsLoading(false);
    };

    fetchCourse();
  }, [subdomain]);

  // ── Enroll ───────────────────────────────────────────────

  const handleEnroll = async () => {
    if (enrolling || !course) return;
    setEnrolling(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth", { state: { redirect: `/course/${subdomain}` } }); setEnrolling(false); return; }
    const { data: existing } = await supabase.from("enrollments").select("id").eq("course_id", course.id).eq("user_id", user.id).maybeSingle();
    if (existing) { toast.info("You're already enrolled!"); navigate(`/learn/${subdomain}`); setEnrolling(false); return; }
    if (!course.is_free && course.price_cents && course.price_cents > 0) { navigate(`/checkout?course=${course.id}`); setEnrolling(false); return; }
    const { error } = await supabase.from("enrollments").insert({ course_id: course.id, user_id: user.id });
    if (error) { toast.error("Failed to enroll."); setEnrolling(false); return; }
    toast.success("Enrolled successfully!");
    navigate(`/learn/${subdomain}`);
    setEnrolling(false);
  };

  // ── Derived ──────────────────────────────────────────────

  const mappedCourse = useMemo(() => course ? mapRowToExtendedCourse(course) : null, [course]);

  // ── Loading / Not Found ──────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !course || !mappedCourse) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 font-sans">
        <h1 className="text-4xl font-bold">Course Not Found</h1>
        <p className="text-muted-foreground">This course doesn't exist or hasn't been published yet.</p>
        <a href="/" className="text-primary underline">Go Home</a>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <>
      <Helmet>
        <title>{course.seo_title || course.title} | Excellion</title>
        <meta name="description" content={course.seo_description || course.description || course.tagline || "Online course on Excellion"} />
        {(course.social_image_url || course.thumbnail_url) && <meta property="og:image" content={course.social_image_url || course.thumbnail_url} />}
        <meta property="og:title" content={course.seo_title || course.title} />
      </Helmet>

      {/* Owner preview banner */}
      {isOwnerPreview && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/25 text-yellow-400 text-center py-2 px-4 text-sm">
          Preview mode — only you can see this.{" "}
          <button onClick={() => navigate(-1)} className="underline font-semibold bg-transparent border-none text-inherit cursor-pointer">
            Back to builder
          </button>
        </div>
      )}

      <DynamicCoursePreview
        course={mappedCourse}
        onEnrollClick={handleEnroll}
      />
    </>
  );
};

export default CoursePage;
