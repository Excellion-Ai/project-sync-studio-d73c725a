import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

// ── Types (local, inline-style rendering — no Tailwind) ──────

interface DesignColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  cardBackground: string;
  text: string;
  textMuted: string;
}

interface DesignFonts {
  heading: string;
  body: string;
}

interface DesignConfig {
  colors?: Partial<DesignColors>;
  fonts?: Partial<DesignFonts>;
  backgrounds?: { hero?: string; curriculum?: string; cta?: string };
  heroStyle?: string;
  spacing?: string;
  borderRadius?: string;
}

interface ModuleLesson {
  id: string;
  title: string;
  duration?: string;
  type?: string;
}

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  lessons: ModuleLesson[];
}

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  tagline: string | null;
  hero_copy: string | null;
  curriculum: any;
  design_config: any;
  section_order: any;
  price_cents: number | null;
  currency: string | null;
  is_free: boolean | null;
  status: string | null;
  slug: string;
  subdomain: string | null;
  thumbnail_url: string | null;
  instructor_name: string | null;
  instructor_bio: string | null;
  meta: any;
  builder_project_id: string | null;
  layout_template: string | null;
}

// ── Defaults ─────────────────────────────────────────────────

const DEFAULT_COLORS: DesignColors = {
  primary: "#d4a853",
  secondary: "#1a1a1a",
  accent: "#f59e0b",
  background: "#0a0a0a",
  cardBackground: "#111111",
  text: "#ffffff",
  textMuted: "#9ca3af",
};

const DEFAULT_FONTS: DesignFonts = {
  heading: "Inter",
  body: "Inter",
};

function resolveColors(dc?: DesignConfig): DesignColors {
  return { ...DEFAULT_COLORS, ...(dc?.colors || {}) };
}

function resolveFonts(dc?: DesignConfig): DesignFonts {
  return { ...DEFAULT_FONTS, ...(dc?.fonts || {}) };
}

function parseModules(curriculum: any): CourseModule[] {
  if (!Array.isArray(curriculum)) return [];
  return curriculum.map((mod: any, i: number) => ({
    id: mod.id || `mod-${i}`,
    title: mod.title || `Module ${i + 1}`,
    description: mod.description || "",
    lessons: Array.isArray(mod.lessons)
      ? mod.lessons.map((l: any, j: number) => ({
          id: l.id || `les-${i}-${j}`,
          title: l.title || `Lesson ${j + 1}`,
          duration: l.duration || "",
          type: l.type || "text",
        }))
      : [],
  }));
}

function totalLessons(modules: CourseModule[]): number {
  return modules.reduce((s, m) => s + m.lessons.length, 0);
}

function totalDuration(modules: CourseModule[]): string {
  let mins = 0;
  for (const m of modules) {
    for (const l of m.lessons) {
      const d = l.duration?.trim() ?? "";
      const h = d.match(/([\d.]+)\s*h/i);
      const mi = d.match(/([\d.]+)\s*m/i);
      if (h) mins += parseFloat(h[1]) * 60;
      if (mi) mins += parseFloat(mi[1]);
      if (!h && !mi) {
        const n = parseFloat(d);
        if (!isNaN(n)) mins += n;
      }
    }
  }
  const hours = Math.floor(mins / 60);
  const remainder = Math.round(mins % 60);
  if (hours > 0 && remainder > 0) return `${hours}h ${remainder}m`;
  if (hours > 0) return `${hours}h`;
  return `${Math.max(remainder, 1)}m`;
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

// ── Google Fonts loader ──────────────────────────────────────

function useGoogleFonts(fonts: DesignFonts) {
  useEffect(() => {
    const families = [fonts.heading, fonts.body].filter(
      (f) => f && f !== "Inter" && f !== "sans-serif"
    );
    if (families.length === 0) return;

    const id = "course-page-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    const href = `https://fonts.googleapis.com/css2?${families
      .map((f) => `family=${encodeURIComponent(f!)}:wght@400;500;600;700;800`)
      .join("&")}&display=swap`;

    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;

    return () => {
      link?.remove();
    };
  }, [fonts.heading, fonts.body]);
}

// ── Component ────────────────────────────────────────────────

const CoursePage = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // ── Fetch course ───────────────────────────────────────────

  useEffect(() => {
    if (!subdomain) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const fetchCourse = async () => {
      // Try subdomain first
      let { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("subdomain", subdomain)
        .eq("status", "published")
        .maybeSingle();

      // Fallback: try as UUID
      if (!data && subdomain.match(/^[0-9a-f-]{36}$/i)) {
        const res = await supabase
          .from("courses")
          .select("*")
          .eq("id", subdomain)
          .eq("status", "published")
          .maybeSingle();
        data = res.data;
        error = res.error;
      }

      if (error || !data) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      let courseData = data as CourseData;

      // Fallback: if design_config is empty, pull from builder_projects spec
      const dc = courseData.design_config;
      const hasDesign = dc && typeof dc === "object" && Object.keys(dc).length > 0;

      if (!hasDesign && courseData.builder_project_id) {
        const { data: proj } = await supabase
          .from("builder_projects")
          .select("*")
          .eq("id", courseData.builder_project_id)
          .maybeSingle();

        if (proj) {
          const spec = (proj as any).spec;
          if (spec?.courseSpec?.design_config) {
            courseData = {
              ...courseData,
              design_config: spec.courseSpec.design_config,
            };
          }
        }
      }

      // Track view
      await supabase.from("course_views").insert({
        course_id: courseData.id,
        device_type: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
        referrer: document.referrer || null,
      });

      setCourse(courseData);
      setIsLoading(false);
    };

    fetchCourse();
  }, [subdomain]);

  // ── Derived values ─────────────────────────────────────────

  const dc: DesignConfig = (course?.design_config as DesignConfig) || {};
  const colors = useMemo(() => resolveColors(dc), [dc]);
  const fonts = useMemo(() => resolveFonts(dc), [dc]);
  const modules = useMemo(() => parseModules(course?.curriculum), [course?.curriculum]);
  const lessonCount = useMemo(() => totalLessons(modules), [modules]);
  const duration = useMemo(() => totalDuration(modules), [modules]);
  const priceLabel = useMemo(
    () => formatPrice(course?.price_cents ?? null, course?.currency ?? null, course?.is_free ?? null),
    [course?.price_cents, course?.currency, course?.is_free]
  );
  const heroImage = dc.backgrounds?.hero || course?.thumbnail_url;
  const difficulty = (course?.meta as any)?.difficulty || "All Levels";

  useGoogleFonts(fonts);

  // ── Enroll handler ─────────────────────────────────────────

  const handleEnroll = async () => {
    if (enrolling || !course) return;
    setEnrolling(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/auth", { state: { redirect: `/course/${subdomain}` } });
      setEnrolling(false);
      return;
    }

    // Check existing enrollment
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

    // If paid course, redirect to checkout
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

  // ── Loading state ──────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: DEFAULT_COLORS.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: `3px solid ${DEFAULT_COLORS.primary}`,
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────

  if (notFound || !course) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: DEFAULT_COLORS.background,
          color: DEFAULT_COLORS.text,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontFamily: `"Inter", sans-serif`,
        }}
      >
        <h1 style={{ fontSize: 36, fontWeight: 700 }}>Course Not Found</h1>
        <p style={{ color: DEFAULT_COLORS.textMuted }}>
          This course doesn't exist or hasn't been published yet.
        </p>
        <a
          href="/"
          style={{ color: DEFAULT_COLORS.primary, textDecoration: "underline" }}
        >
          Go Home
        </a>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────

  const headingFont = `"${fonts.heading}", sans-serif`;
  const bodyFont = `"${fonts.body}", sans-serif`;

  return (
    <>
      <Helmet>
        <title>{course.title} | Excellion</title>
        <meta
          name="description"
          content={course.description || course.tagline || "Online course on Excellion"}
        />
        {course.thumbnail_url && (
          <meta property="og:image" content={course.thumbnail_url} />
        )}
      </Helmet>

      <div
        style={{
          minHeight: "100vh",
          background: colors.background,
          color: colors.text,
          fontFamily: bodyFont,
          lineHeight: 1.6,
        }}
      >
        {/* ── Hero Section ──────────────────────────────────── */}
        <section
          style={{
            position: "relative",
            minHeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Background image */}
          {heroImage && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${heroImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}

          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: heroImage
                ? `linear-gradient(180deg, ${colors.background}CC 0%, ${colors.background}E6 50%, ${colors.background} 100%)`
                : `linear-gradient(135deg, ${colors.background} 0%, ${colors.secondary} 50%, ${colors.background} 100%)`,
            }}
          />

          {/* Hero content */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: 800,
              width: "100%",
              padding: "80px 24px 60px",
              textAlign: "center",
            }}
          >
            {/* Difficulty badge */}
            <div
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: 20,
                background: `${colors.primary}22`,
                border: `1px solid ${colors.primary}44`,
                color: colors.primary,
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 24,
              }}
            >
              {difficulty}
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: headingFont,
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 800,
                lineHeight: 1.15,
                color: colors.text,
                margin: "0 0 16px",
              }}
            >
              {course.title}
            </h1>

            {/* Tagline */}
            {course.tagline && (
              <p
                style={{
                  fontSize: "clamp(16px, 2.5vw, 20px)",
                  color: colors.primary,
                  fontWeight: 500,
                  margin: "0 0 16px",
                }}
              >
                {course.tagline}
              </p>
            )}

            {/* Description */}
            {course.description && (
              <p
                style={{
                  fontSize: "clamp(14px, 2vw, 17px)",
                  color: colors.textMuted,
                  maxWidth: 600,
                  margin: "0 auto 32px",
                }}
              >
                {course.description}
              </p>
            )}

            {/* Stats */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 32,
                marginBottom: 36,
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "Modules", value: String(modules.length) },
                { label: "Lessons", value: String(lessonCount) },
                { label: "Duration", value: duration },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: colors.text,
                      fontFamily: headingFont,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Enroll button */}
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 40px",
                borderRadius: 8,
                background: colors.primary,
                color: colors.background,
                fontSize: 16,
                fontWeight: 700,
                border: "none",
                cursor: enrolling ? "wait" : "pointer",
                opacity: enrolling ? 0.7 : 1,
                transition: "opacity 0.2s, transform 0.2s",
                fontFamily: headingFont,
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => {
                if (!enrolling) (e.currentTarget.style.opacity = "0.9");
              }}
              onMouseLeave={(e) => {
                if (!enrolling) (e.currentTarget.style.opacity = "1");
              }}
            >
              {enrolling ? (
                "Enrolling..."
              ) : (
                <>
                  {priceLabel === "Free" ? "Enroll for Free" : `Enroll — ${priceLabel}`}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ marginLeft: 4 }}
                  >
                    <path
                      d="M3 8h10m0 0L9 4m4 4L9 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>

            {/* Instructor */}
            {course.instructor_name && (
              <p
                style={{
                  marginTop: 20,
                  fontSize: 13,
                  color: colors.textMuted,
                }}
              >
                by{" "}
                <span style={{ color: colors.text, fontWeight: 500 }}>
                  {course.instructor_name}
                </span>
              </p>
            )}
          </div>
        </section>

        {/* ── Curriculum Section ─────────────────────────────── */}
        {modules.length > 0 && (
          <section
            style={{
              maxWidth: 800,
              margin: "0 auto",
              padding: "64px 24px",
            }}
          >
            <h2
              style={{
                fontFamily: headingFont,
                fontSize: 28,
                fontWeight: 700,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Course Curriculum
            </h2>
            <p
              style={{
                textAlign: "center",
                color: colors.textMuted,
                fontSize: 15,
                marginBottom: 40,
              }}
            >
              {modules.length} modules · {lessonCount} lessons · {duration} total
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {modules.map((mod, i) => (
                <div
                  key={mod.id}
                  style={{
                    background: colors.cardBackground,
                    border: `1px solid ${colors.primary}15`,
                    borderRadius: 12,
                    padding: "20px 24px",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget.style.borderColor = `${colors.primary}40`);
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget.style.borderColor = `${colors.primary}15`);
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                    }}
                  >
                    {/* Module number */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `${colors.primary}18`,
                        color: colors.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 16,
                        fontFamily: headingFont,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontFamily: headingFont,
                          fontSize: 17,
                          fontWeight: 600,
                          margin: "0 0 4px",
                          color: colors.text,
                        }}
                      >
                        {mod.title}
                      </h3>
                      {mod.description && (
                        <p
                          style={{
                            fontSize: 13,
                            color: colors.textMuted,
                            margin: "0 0 8px",
                          }}
                        >
                          {mod.description}
                        </p>
                      )}
                      <div
                        style={{
                          fontSize: 12,
                          color: colors.textMuted,
                          display: "flex",
                          gap: 12,
                        }}
                      >
                        <span>
                          {mod.lessons.length}{" "}
                          {mod.lessons.length === 1 ? "lesson" : "lessons"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enroll CTA below curriculum */}
            <div style={{ textAlign: "center", marginTop: 48 }}>
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 36px",
                  borderRadius: 8,
                  background: colors.primary,
                  color: colors.background,
                  fontSize: 15,
                  fontWeight: 700,
                  border: "none",
                  cursor: enrolling ? "wait" : "pointer",
                  opacity: enrolling ? 0.7 : 1,
                  fontFamily: headingFont,
                }}
              >
                {enrolling
                  ? "Enrolling..."
                  : priceLabel === "Free"
                  ? "Start Learning for Free"
                  : `Get Access — ${priceLabel}`}
              </button>
            </div>
          </section>
        )}

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer
          style={{
            borderTop: `1px solid ${colors.primary}15`,
            padding: "32px 24px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: colors.textMuted,
            }}
          >
            Powered by{" "}
            <a
              href="https://excellioncourses.lovable.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: colors.primary,
                textDecoration: "none",
                fontWeight: 600,
              }}
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
