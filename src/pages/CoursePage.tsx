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

// ── Override .dark theme for published course ───────────────

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 50%";
  let r = parseInt(result[1], 16) / 255, g = parseInt(result[2], 16) / 255, b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function adj(hsl: string, delta: number): string {
  const m = hsl.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!m) return hsl;
  return `${Math.round(parseFloat(m[1]))} ${Math.round(parseFloat(m[2]))}% ${Math.round(Math.max(0, Math.min(100, parseFloat(m[3]) + delta)))}%`;
}

/** Inject <style> into head that overrides .dark {} from index.css with course colors */
function useOverrideDarkTheme(dc: any) {
  useEffect(() => {
    if (!dc?.colors) return;
    const c = dc.colors; const f = dc.fonts; const v: string[] = [];
    if (c.primary) { const p = hexToHSL(c.primary); v.push(`--primary:${p}`, `--accent:${p}`, `--ring:${p}`, `--gold:${p}`, `--gold-light:${adj(p,12)}`, `--gold-dark:${adj(p,-12)}`); }
    if (c.background) { const bg = hexToHSL(c.background); v.push(`--background:${bg}`); if (c.text) v.push(`--primary-foreground:${bg}`, `--accent-foreground:${bg}`); }
    if (c.cardBackground) { const cd = hexToHSL(c.cardBackground); v.push(`--card:${cd}`, `--popover:${cd}`, `--border:${adj(cd,8)}`, `--input:${adj(cd,5)}`); if (c.text) v.push(`--card-foreground:${hexToHSL(c.text)}`, `--popover-foreground:${hexToHSL(c.text)}`); }
    if (c.text) v.push(`--foreground:${hexToHSL(c.text)}`);
    if (c.textMuted) v.push(`--muted-foreground:${hexToHSL(c.textMuted)}`);
    if (c.secondary) { const s = hexToHSL(c.secondary); v.push(`--secondary:${s}`, `--muted:${s}`); }
    if (f?.heading) v.push(`--font-heading:'${f.heading}',serif`);
    if (f?.body) v.push(`--font-body:'${f.body}',sans-serif`);
    const el = document.createElement("style");
    el.id = "course-theme";
    el.textContent = `.dark{${v.join(";")}}`;
    document.head.appendChild(el);
    return () => { document.getElementById("course-theme")?.remove(); };
  }, [dc]);
}

// ── Component ───────────────────────────────────────────────

const CoursePage = () => {
  // Accept :slug from /c/:slug or :slug from /course/:slug
  const params = useParams<{ slug: string; subdomain: string }>();
  const identifier = params.slug || params.subdomain || "";
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [isOwnerPreview, setIsOwnerPreview] = useState(false);

  // ── Fetch ────────────────────────────────────────────────

  useEffect(() => {
    const fetchCourse = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const findOne = async (q: any) => { const { data: rows } = await q; return rows?.[0] ?? null; };
      const sel = "*";

      let row: any = null;
      let ownerPreview = false;

      // 0. Check if hostname is a verified custom domain
      const hostname = window.location.hostname;
      const isCustomDomain = hostname !== "localhost"
        && !hostname.includes("excellioncourses")
        && !hostname.includes("lovable")
        && !hostname.includes("lovableproject");

      if (isCustomDomain) {
        row = await findOne(
          supabase.from("courses").select(sel)
            .eq("custom_domain", hostname).eq("domain_verified", true)
            .eq("status", "published").is("deleted_at", null).limit(1)
        );
      }

      // 1. Published by slug (primary — clean URL)
      if (!row && identifier) {
        row = await findOne(supabase.from("courses").select(sel).eq("slug", identifier).eq("status", "published").is("deleted_at", null).limit(1));
      }

      // 2. Published by subdomain (backwards compat)
      if (!row && identifier) {
        row = await findOne(supabase.from("courses").select(sel).eq("subdomain", identifier).eq("status", "published").is("deleted_at", null).limit(1));
      }

      // 3. Owner draft by slug or subdomain
      if (!row && identifier && user) {
        row = await findOne(supabase.from("courses").select(sel).eq("slug", identifier).eq("user_id", user.id).is("deleted_at", null).limit(1));
        if (!row) row = await findOne(supabase.from("courses").select(sel).eq("subdomain", identifier).eq("user_id", user.id).is("deleted_at", null).limit(1));
        if (row) ownerPreview = true;
      }

      // 4. UUID fallback
      if (!row && identifier && identifier.match(/^[0-9a-f-]{36}$/i)) {
        row = await findOne(supabase.from("courses").select(sel).eq("id", identifier).eq("status", "published").is("deleted_at", null).limit(1));
        if (!row && user) {
          row = await findOne(supabase.from("courses").select(sel).eq("id", identifier).eq("user_id", user.id).is("deleted_at", null).limit(1));
          if (row) ownerPreview = true;
        }
      }

      if (!row && !identifier) {
        // No slug in URL and no custom domain match
        setNotFound(true);
        setIsLoading(false);
        return;
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
  }, [identifier]);

  // ── Enroll ───────────────────────────────────────────────

  const handleEnroll = async () => {
    if (enrolling || !course) return;
    setEnrolling(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth", { state: { redirect: `/course/${identifier}` } }); setEnrolling(false); return; }
    const { data: existing } = await supabase.from("enrollments").select("id").eq("course_id", course.id).eq("user_id", user.id).maybeSingle();
    if (existing) { toast.info("You're already enrolled!"); navigate(`/learn/${course.slug || identifier}`); setEnrolling(false); return; }
    if (!course.is_free && course.price_cents && course.price_cents > 0) { navigate(`/checkout?course=${course.id}`); setEnrolling(false); return; }
    const { error } = await supabase.from("enrollments").insert({ course_id: course.id, user_id: user.id });
    if (error) { toast.error("Failed to enroll."); setEnrolling(false); return; }
    toast.success("Enrolled successfully!");
    navigate(`/learn/${course.slug || identifier}`);
    setEnrolling(false);
  };

  // ── Override .dark theme ─────────────────────────────────
  useOverrideDarkTheme(course?.design_config);

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

      {/* ── Course site navigation header ─────────────────── */}
      <nav className="flex items-center h-16 border-b border-border px-6 shrink-0 bg-background sticky top-0 z-50">
        {/* Left — Course logo */}
        <div className="flex items-center gap-3 shrink-0">
          {(course.design_config?.logoUrl || course.thumbnail_url) ? (
            <img src={course.design_config?.logoUrl || course.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {course.title?.[0] || "C"}
            </div>
          )}
          <span className="text-sm font-semibold text-foreground hidden sm:block truncate max-w-[200px]">
            {course.title}
          </span>
        </div>

        {/* Center — Navigation links */}
        <div className="hidden md:flex items-center justify-center gap-1 flex-1">
          {["Landing", "Curriculum"].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right — Enroll CTA */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="px-5 py-2 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {enrolling ? "Enrolling..." : "Enroll Now"}
          </button>
        </div>
      </nav>

      <DynamicCoursePreview
        course={mappedCourse}
        onEnrollClick={handleEnroll}
      />
    </>
  );
};

export default CoursePage;
