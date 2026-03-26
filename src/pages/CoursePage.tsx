import { useState, useEffect, useMemo, Component, type ReactNode, type ErrorInfo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import CourseLandingPreview from "@/components/secret-builder/CourseLandingPreview";
import { ExtendedCourse } from "@/types/course-pages";

// ── Error Boundary ──────────────────────────────────────────

class CourseErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined as Error | undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CoursePage render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ── Helpers ─────────────────────────────────────────────────

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 50%";
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function adjustHSLLightness(hsl: string, delta: number): string {
  const m = hsl.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!m) return hsl;
  const l = Math.max(0, Math.min(100, parseFloat(m[3]) + delta));
  return `${Math.round(parseFloat(m[1]))} ${Math.round(parseFloat(m[2]))}% ${Math.round(l)}%`;
}

function buildThemeVars(colors: Record<string, string | undefined>): Record<string, string> {
  const vars: Record<string, string> = {};
  if (colors.primary) {
    const hsl = hexToHSL(colors.primary);
    vars["--primary"] = hsl;
    vars["--accent"] = hsl;
    vars["--ring"] = hsl;
    vars["--gold"] = hsl;
    vars["--gold-light"] = adjustHSLLightness(hsl, 12);
    vars["--gold-dark"] = adjustHSLLightness(hsl, -12);
    vars["--shadow-glow"] = `0 0 60px hsl(${hsl} / 0.12)`;
    vars["--shadow-glow-sm"] = `0 0 20px hsl(${hsl} / 0.08)`;
    vars["--shadow-glow-lg"] = `0 0 100px hsl(${hsl} / 0.1)`;
  }
  if (colors.background) vars["--background"] = hexToHSL(colors.background);
  if (colors.cardBackground) {
    const cardHSL = hexToHSL(colors.cardBackground);
    vars["--card"] = cardHSL;
    vars["--card-elevated"] = adjustHSLLightness(cardHSL, 3);
    vars["--border"] = adjustHSLLightness(cardHSL, 8);
    vars["--input"] = adjustHSLLightness(cardHSL, 5);
    if (colors.text) vars["--card-foreground"] = hexToHSL(colors.text);
  }
  if (colors.text) {
    vars["--foreground"] = hexToHSL(colors.text);
    if (colors.background) {
      vars["--primary-foreground"] = hexToHSL(colors.background);
      vars["--accent-foreground"] = hexToHSL(colors.background);
    }
  }
  if (colors.textMuted) vars["--muted-foreground"] = hexToHSL(colors.textMuted);
  if (colors.secondary) {
    const secHSL = hexToHSL(colors.secondary);
    vars["--secondary"] = secHSL;
    vars["--muted"] = secHSL;
  }
  return vars;
}

function loadGoogleFont(fontName: string) {
  if (!fontName || fontName === "Inter" || fontName === "sans-serif") return;
  const id = `gfont-${fontName.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

function formatPrice(cents: number | null, currency: string | null, isFree: boolean | null): string {
  if (isFree || !cents || cents === 0) return "Free";
  const amount = cents / 100;
  const cur = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

// ── Component ────────────────────────────────────────────────

const CoursePage = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [isOwnerPreview, setIsOwnerPreview] = useState(false);

  // ── Fetch course ───────────────────────────────────────────

  useEffect(() => {
    if (!subdomain) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const fetchCourse = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // Helper: run query and return first row or null
      const findOne = async (q: any) => {
        const { data: rows } = await q;
        return rows?.[0] ?? null;
      };

      let courseRow: any = null;
      let ownerPreview = false;

      // 1. Published by subdomain (public)
      courseRow = await findOne(
        supabase.from("courses").select("*")
          .eq("subdomain", subdomain).eq("status", "published").is("deleted_at", null).limit(1)
      );

      // 2. Owner draft by subdomain
      if (!courseRow && user) {
        courseRow = await findOne(
          supabase.from("courses").select("*")
            .eq("subdomain", subdomain).eq("user_id", user.id).is("deleted_at", null).limit(1)
        );
        if (courseRow) ownerPreview = true;
      }

      // 3. Published by UUID
      if (!courseRow && subdomain.match(/^[0-9a-f-]{36}$/i)) {
        courseRow = await findOne(
          supabase.from("courses").select("*")
            .eq("id", subdomain).eq("status", "published").is("deleted_at", null).limit(1)
        );
        if (!courseRow && user) {
          courseRow = await findOne(
            supabase.from("courses").select("*")
              .eq("id", subdomain).eq("user_id", user.id).is("deleted_at", null).limit(1)
          );
          if (courseRow) ownerPreview = true;
        }
      }

      if (!courseRow) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setIsOwnerPreview(ownerPreview);
      let data = courseRow;

      // Fallback: if design_config is empty, pull from builder_projects
      const dc = data.design_config;
      const hasDesign = dc && typeof dc === "object" && Object.keys(dc).length > 0;
      if (!hasDesign && data.builder_project_id) {
        const { data: proj } = await supabase
          .from("builder_projects")
          .select("*")
          .eq("id", data.builder_project_id)
          .limit(1);
        if (proj) {
          const spec = (proj as any).spec;
          if (spec?.courseSpec?.design_config) {
            data = { ...data, design_config: spec.courseSpec.design_config };
          }
        }
      }

      // Track view (skip for owner previews)
      if (!isOwnerPreview) {
        await supabase.from("course_views").insert({
          course_id: data.id,
          device_type: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
          referrer: document.referrer || null,
        });
      }

      setCourse(data);
      setIsLoading(false);
    };

    fetchCourse();
  }, [subdomain]);

  // ── Build ExtendedCourse for CourseLandingPreview ──────────

  const extendedCourse: ExtendedCourse | null = useMemo(() => {
    if (!course) return null;
    const modules = Array.isArray(course.curriculum) ? course.curriculum : [];
    const dc = (course.design_config as any) || {};
    const pageSections = (course.page_sections as any) || {};
    const meta = (course.meta as any) || {};
    const sectionOrder = Array.isArray(course.section_order)
      ? course.section_order
      : pageSections?.landing_sections;

    return {
      id: course.id,
      title: course.title,
      description: course.description || "",
      tagline: course.tagline || "",
      difficulty: meta.difficulty || "beginner",
      duration_weeks: meta.duration_weeks || 6,
      layout_style: (course.layout_template || "creator") as any,
      layout_template: course.layout_template || "creator",
      learningOutcomes: pageSections?.outcomes ?? dc?.learningOutcomes ?? [],
      modules: modules.map((mod: any, i: number) => ({
        id: mod.id || `mod-${i}`,
        title: mod.title || `Module ${i + 1}`,
        description: mod.description || "",
        is_first: i === 0,
        is_last: i === modules.length - 1,
        lessons: (mod.lessons || []).map((l: any, j: number) => ({
          id: l.id || `mod-${i}-les-${j}`,
          title: l.title || `Lesson ${j + 1}`,
          duration: l.duration || "20m",
          type: l.type || "text",
          description: l.description || "",
          content_markdown: l.content_markdown || "",
          video_url: l.video_url,
          quiz_questions: l.quiz_questions,
          passing_score: l.passing_score,
          assignment_brief: l.assignment_brief,
        })),
      })),
      pages: {
        ...pageSections,
        landing_sections: sectionOrder,
        pricing: course.price_cents
          ? { price: course.price_cents / 100, original_price: null }
          : undefined,
        instructor: course.instructor_name
          ? { name: course.instructor_name, bio: course.instructor_bio || "", avatar: "" }
          : pageSections?.instructor,
      },
      section_order: sectionOrder,
      design_config: dc,
      thumbnail: course.thumbnail_url || "",
    };
  }, [course]);

  // ── Theme CSS variables ────────────────────────────────────

  const themeStyle = useMemo(() => {
    if (!course?.design_config?.colors) return {};
    const vars = buildThemeVars(course.design_config.colors);
    return vars as React.CSSProperties;
  }, [course?.design_config?.colors]);

  // Load fonts
  useEffect(() => {
    const fonts = course?.design_config?.fonts;
    if (fonts?.heading) loadGoogleFont(fonts.heading);
    if (fonts?.body) loadGoogleFont(fonts.body);
  }, [course?.design_config?.fonts]);

  // ── Enroll handler ─────────────────────────────────────────

  const handleEnroll = async () => {
    if (enrolling || !course) return;
    setEnrolling(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth", { state: { redirect: `/course/${subdomain}` } });
      setEnrolling(false);
      return;
    }

    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", course.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      toast.info("You're already enrolled!");
      navigate(`/learn/${subdomain}`);
      setEnrolling(false);
      return;
    }

    if (!course.is_free && course.price_cents && course.price_cents > 0) {
      navigate(`/checkout?course=${course.id}`);
      setEnrolling(false);
      return;
    }

    const { error } = await supabase.from("enrollments").insert({
      course_id: course.id,
      user_id: user.id,
    });

    if (error) {
      toast.error("Failed to enroll. Please try again.");
      setEnrolling(false);
      return;
    }

    toast.success("Enrolled successfully!");
    navigate(`/learn/${subdomain}`);
    setEnrolling(false);
  };

  // ── Loading ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────

  if (notFound || !course || !extendedCourse) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 font-sans">
        <h1 className="text-4xl font-bold">Course Not Found</h1>
        <p className="text-muted-foreground">
          This course doesn't exist or hasn't been published yet.
        </p>
        <a href="/" className="text-primary underline">Go Home</a>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────

  const fontVars: React.CSSProperties = {};
  const fonts = course.design_config?.fonts;
  if (fonts?.heading) (fontVars as any)["--font-heading"] = `"${fonts.heading}", sans-serif`;
  if (fonts?.body) (fontVars as any)["--font-body"] = `"${fonts.body}", sans-serif`;

  return (
    <>
      <Helmet>
        <title>{course.seo_title || course.title} | Excellion</title>
        <meta
          name="description"
          content={course.seo_description || course.description || course.tagline || "Online course on Excellion"}
        />
        {(course.social_image_url || course.thumbnail_url) && (
          <meta property="og:image" content={course.social_image_url || course.thumbnail_url} />
        )}
        <meta property="og:title" content={course.seo_title || course.title} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div style={{ ...themeStyle, ...fontVars }}>
        {/* Owner preview banner */}
        {isOwnerPreview && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/30 text-yellow-400 text-center py-2 px-4 text-sm">
            Preview mode — only you can see this. <button onClick={() => navigate(-1)} className="underline font-medium ml-1">Back to builder</button>
          </div>
        )}

        <CourseErrorBoundary
          fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: course.design_config?.colors?.background || "#0a0a0a", color: course.design_config?.colors?.text || "#fff" }}>
              <div style={{ textAlign: "center", maxWidth: 600, padding: "40px 24px" }}>
                <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16 }}>{course.title}</h1>
                {course.description && <p style={{ color: course.design_config?.colors?.textMuted || "#9ca3af", marginBottom: 24 }}>{course.description}</p>}
                <button onClick={handleEnroll} style={{ padding: "12px 32px", borderRadius: 8, background: course.design_config?.colors?.primary || "#d4a853", color: course.design_config?.colors?.background || "#0a0a0a", fontWeight: 700, border: "none", cursor: "pointer" }}>
                  Enroll Now
                </button>
              </div>
            </div>
          }
        >
          <CourseLandingPreview
            course={extendedCourse}
            onEnrollClick={handleEnroll}
          />
        </CourseErrorBoundary>

        {/* Footer */}
        <footer className="border-t border-border py-8 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <a
              href="https://excellioncourses.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              Excellion
            </a>
          </p>
        </footer>
      </div>
    </>
  );
};

export default CoursePage;
