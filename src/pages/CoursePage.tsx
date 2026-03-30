import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

// ── Types ───────────────────────────────────────────────────

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

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  lessons: Array<{ id: string; title: string; duration?: string; type?: string }>;
}

// ── Defaults & Helpers ──────────────────────────────────────

const DEFAULT_COLORS: DesignColors = {
  primary: "#d4a853",
  secondary: "#1a1a1a",
  accent: "#f59e0b",
  background: "#0a0a0a",
  cardBackground: "#111111",
  text: "#ffffff",
  textMuted: "#9ca3af",
};

const DEFAULT_FONTS: DesignFonts = { heading: "Inter", body: "Inter" };

function resolveColors(dc: any): DesignColors {
  return { ...DEFAULT_COLORS, ...(dc?.colors || {}) };
}

function resolveFonts(dc: any): DesignFonts {
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
      if (!h && !mi) { const n = parseFloat(d); if (!isNaN(n)) mins += n; }
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
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: (currency || "USD").toUpperCase() }).format(amount); }
  catch { return `$${amount.toFixed(2)}`; }
}

function loadGoogleFont(name: string) {
  if (!name || name === "Inter" || name === "sans-serif") return;
  const id = `gfont-${name.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
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
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  // ── Fetch ────────────────────────────────────────────────

  // Non-sensitive columns for public course reads
  const PUBLIC_COURSE_COLUMNS = "id,title,description,tagline,slug,subdomain,curriculum,design_config,layout_template,section_order,section_config,page_sections,meta,status,is_free,price_cents,currency,thumbnail_url,hero_copy,instructor_name,instructor_bio,seo_title,seo_description,social_image_url,type,total_students,branding,created_at,updated_at,published_at,deleted_at,has_video_content,is_featured,custom_domain,domain_verified,original_prompt,builder_project_id";

  useEffect(() => {
    if (!subdomain) { setNotFound(true); setIsLoading(false); return; }

    const fetchCourse = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const findOne = async (q: any) => { const { data: rows } = await q; return rows?.[0] ?? null; };

      let row: any = null;
      let ownerPreview = false;

      // Published by subdomain
      row = await findOne(supabase.from("courses").select(PUBLIC_COURSE_COLUMNS).eq("subdomain", subdomain).eq("status", "published").is("deleted_at", null).limit(1));

      // Owner draft by subdomain
      if (!row && user) {
        row = await findOne(supabase.from("courses").select(PUBLIC_COURSE_COLUMNS).eq("subdomain", subdomain).eq("user_id", user.id).is("deleted_at", null).limit(1));
        if (row) ownerPreview = true;
      }

      // UUID fallback
      if (!row && subdomain.match(/^[0-9a-f-]{36}$/i)) {
        row = await findOne(supabase.from("courses").select(PUBLIC_COURSE_COLUMNS).eq("id", subdomain).eq("status", "published").is("deleted_at", null).limit(1));
        if (!row && user) {
          row = await findOne(supabase.from("courses").select(PUBLIC_COURSE_COLUMNS).eq("id", subdomain).eq("user_id", user.id).is("deleted_at", null).limit(1));
          if (row) ownerPreview = true;
        }
      }

      if (!row) { setNotFound(true); setIsLoading(false); return; }

      setIsOwnerPreview(ownerPreview);

      // Track view (not for owners)
      if (!ownerPreview) {
        supabase.from("course_views").insert({ course_id: row.id, device_type: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop", referrer: document.referrer || null });
      }

      setCourse(row);
      setIsLoading(false);
    };

    fetchCourse();
  }, [subdomain]);

  // ── Derived ──────────────────────────────────────────────

  const dc = course?.design_config || {};
  const colors = useMemo(() => resolveColors(dc), [dc]);
  const fonts = useMemo(() => resolveFonts(dc), [dc]);
  const modules = useMemo(() => parseModules(course?.curriculum), [course?.curriculum]);
  const lessonCount = useMemo(() => totalLessons(modules), [modules]);
  const duration = useMemo(() => totalDuration(modules), [modules]);
  const priceLabel = useMemo(() => formatPrice(course?.price_cents ?? null, course?.currency ?? null, course?.is_free ?? null), [course]);
  const heroImage = dc?.heroImage || dc?.backgrounds?.hero || course?.thumbnail_url;
  const difficulty = (course?.meta as any)?.difficulty || "All Levels";
  const pageSections = (course?.page_sections as any) || {};
  const faq = pageSections?.faq || [];
  const targetAudience = pageSections?.target_audience;
  const instructor = course?.instructor_name ? { name: course.instructor_name, bio: course.instructor_bio || "" } : pageSections?.instructor;

  useEffect(() => {
    if (fonts.heading) loadGoogleFont(fonts.heading);
    if (fonts.body) loadGoogleFont(fonts.body);
  }, [fonts]);

  const headingFont = `"${fonts.heading}", sans-serif`;
  const bodyFont = `"${fonts.body}", sans-serif`;

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

  // ── Loading ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #d4a853", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: '"Inter", sans-serif' }}>
        <h1 style={{ fontSize: 36, fontWeight: 700 }}>Course Not Found</h1>
        <p style={{ color: "#9ca3af" }}>This course doesn't exist or hasn't been published yet.</p>
        <a href="/" style={{ color: "#d4a853", textDecoration: "underline" }}>Go Home</a>
      </div>
    );
  }

  // ── Shared styles ────────────────────────────────────────

  const sectionPad: React.CSSProperties = { maxWidth: 800, margin: "0 auto", padding: "64px 24px" };
  const sectionHeading: React.CSSProperties = { fontFamily: headingFont, fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: "center" as const };
  const cardStyle: React.CSSProperties = { background: colors.cardBackground, border: `1px solid ${colors.primary}15`, borderRadius: 12, padding: "20px 24px", transition: "border-color 0.2s" };
  const btnStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 40px", borderRadius: 8, background: colors.primary, color: colors.background, fontSize: 16, fontWeight: 700, border: "none", cursor: enrolling ? "wait" : "pointer", opacity: enrolling ? 0.7 : 1, fontFamily: headingFont, letterSpacing: "0.02em" };

  // ── Render ───────────────────────────────────────────────

  return (
    <>
      <Helmet>
        <title>{course.seo_title || course.title} | Excellion</title>
        <meta name="description" content={course.seo_description || course.description || course.tagline || "Online course on Excellion"} />
        {(course.social_image_url || course.thumbnail_url) && <meta property="og:image" content={course.social_image_url || course.thumbnail_url} />}
        <meta property="og:title" content={course.seo_title || course.title} />
      </Helmet>

      <div style={{ minHeight: "100vh", background: colors.background, color: colors.text, fontFamily: bodyFont, lineHeight: 1.6 }}>

        {/* Owner preview banner */}
        {isOwnerPreview && (
          <div style={{ background: "#fbbf2420", borderBottom: "1px solid #fbbf2440", color: "#fbbf24", textAlign: "center", padding: "8px 16px", fontSize: 14 }}>
            Preview mode — only you can see this.{" "}
            <button onClick={() => navigate(-1)} style={{ textDecoration: "underline", fontWeight: 600, background: "none", border: "none", color: "inherit", cursor: "pointer" }}>Back to builder</button>
          </div>
        )}

        {/* ── Hero ──────────────────────────────────────────── */}
        <section style={{ position: "relative", minHeight: 500, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {heroImage && <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />}
          <div style={{ position: "absolute", inset: 0, background: heroImage ? `linear-gradient(180deg, ${colors.background}CC 0%, ${colors.background}E6 50%, ${colors.background} 100%)` : `linear-gradient(135deg, ${colors.background} 0%, ${colors.secondary} 50%, ${colors.background} 100%)` }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 800, width: "100%", padding: "80px 24px 60px", textAlign: "center" }}>
            <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: `${colors.primary}22`, border: `1px solid ${colors.primary}44`, color: colors.primary, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 24 }}>
              {difficulty}
            </div>
            <h1 style={{ fontFamily: headingFont, fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, lineHeight: 1.15, color: colors.text, margin: "0 0 16px" }}>{course.title}</h1>
            {course.tagline && <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: colors.primary, fontWeight: 500, margin: "0 0 16px" }}>{course.tagline}</p>}
            {course.description && <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: colors.textMuted, maxWidth: 600, margin: "0 auto 32px" }}>{course.description}</p>}
            <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 36, flexWrap: "wrap" }}>
              {[{ label: "Modules", value: String(modules.length) }, { label: "Lessons", value: String(lessonCount) }, { label: "Duration", value: duration }].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: colors.text, fontFamily: headingFont }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={handleEnroll} disabled={enrolling} style={btnStyle}>
              {enrolling ? "Enrolling..." : priceLabel === "Free" ? "Enroll for Free" : `Enroll — ${priceLabel}`}
            </button>
            {instructor && <p style={{ marginTop: 20, fontSize: 13, color: colors.textMuted }}>by <span style={{ color: colors.text, fontWeight: 500 }}>{instructor.name}</span></p>}
          </div>
        </section>

        {/* ── Who Is This For ───────────────────────────────── */}
        {targetAudience && (
          <section style={sectionPad}>
            <div style={{ ...cardStyle, display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${colors.primary}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>👤</div>
              <div>
                <h3 style={{ fontFamily: headingFont, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Who Is This Course For?</h3>
                <p style={{ fontSize: 14, color: colors.textMuted, margin: 0, lineHeight: 1.6 }}>{targetAudience}</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Curriculum ────────────────────────────────────── */}
        {modules.length > 0 && (
          <section style={sectionPad}>
            <h2 style={sectionHeading}>Course Curriculum</h2>
            <p style={{ textAlign: "center", color: colors.textMuted, fontSize: 15, marginBottom: 40 }}>
              {modules.length} modules · {lessonCount} lessons · {duration} total
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {modules.map((mod, i) => {
                const isOpen = openModules[mod.id];
                return (
                  <div key={mod.id} style={cardStyle}>
                    <button
                      onClick={() => setOpenModules((p) => ({ ...p, [mod.id]: !p[mod.id] }))}
                      style={{ display: "flex", alignItems: "flex-start", gap: 16, width: "100%", background: "none", border: "none", color: "inherit", cursor: "pointer", textAlign: "left", padding: 0 }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${colors.primary}18`, color: colors.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, fontFamily: headingFont, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontFamily: headingFont, fontSize: 17, fontWeight: 600, margin: "0 0 4px", color: colors.text }}>{mod.title}</h3>
                        {mod.description && <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 4px" }}>{mod.description}</p>}
                        <span style={{ fontSize: 12, color: colors.textMuted }}>{mod.lessons.length} {mod.lessons.length === 1 ? "lesson" : "lessons"}</span>
                      </div>
                      <span style={{ fontSize: 18, color: colors.textMuted, marginTop: 8 }}>{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && mod.lessons.length > 0 && (
                      <ul style={{ margin: "12px 0 0 56px", padding: 0, listStyle: "none" }}>
                        {mod.lessons.map((l) => (
                          <li key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14, color: colors.textMuted, borderTop: `1px solid ${colors.primary}10` }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 10 }}>▶</span> {l.title}
                            </span>
                            {l.duration && <span style={{ fontSize: 12, opacity: 0.6 }}>{l.duration}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── FAQ ───────────────────────────────────────────── */}
        {faq.length > 0 && (
          <section style={sectionPad}>
            <h2 style={sectionHeading}>Frequently Asked Questions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 32 }}>
              {faq.map((f: any, i: number) => (
                <details key={i} style={{ ...cardStyle, cursor: "pointer" }}>
                  <summary style={{ fontFamily: headingFont, fontWeight: 600, fontSize: 15, color: colors.text, listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {f.question} <span style={{ color: colors.textMuted, fontSize: 18 }}>+</span>
                  </summary>
                  <p style={{ margin: "12px 0 0", fontSize: 14, color: colors.textMuted, lineHeight: 1.7 }}>{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* ── Instructor ────────────────────────────────────── */}
        {instructor && (
          <section style={sectionPad}>
            <h2 style={sectionHeading}>Your Instructor</h2>
            <div style={{ ...cardStyle, display: "flex", gap: 16, alignItems: "center", marginTop: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${colors.primary}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 24, fontWeight: 700, fontFamily: headingFont, color: colors.primary }}>
                {instructor.name.split(" ").map((w: string) => w[0]).join("")}
              </div>
              <div>
                <h3 style={{ fontFamily: headingFont, fontSize: 18, fontWeight: 700, margin: 0 }}>{instructor.name}</h3>
                {instructor.bio && <p style={{ fontSize: 14, color: colors.textMuted, margin: "4px 0 0", lineHeight: 1.6 }}>{instructor.bio}</p>}
              </div>
            </div>
          </section>
        )}

        {/* ── Bottom CTA ────────────────────────────────────── */}
        <section style={{ ...sectionPad, textAlign: "center" }}>
          <h2 style={{ ...sectionHeading, marginBottom: 16 }}>Ready to Get Started?</h2>
          <p style={{ color: colors.textMuted, marginBottom: 32, fontSize: 17 }}>Join and start your learning journey today.</p>
          <button onClick={handleEnroll} disabled={enrolling} style={btnStyle}>
            {enrolling ? "Enrolling..." : priceLabel === "Free" ? "Start Learning for Free" : `Get Access — ${priceLabel}`}
          </button>
        </section>

        {/* ── Footer ────────────────────────────────────────── */}
        <footer style={{ borderTop: `1px solid ${colors.primary}15`, padding: "32px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: colors.textMuted }}>
            Powered by{" "}
            <a href="https://excellioncourses.com" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: "none", fontWeight: 600 }}>
              Excellion
            </a>
          </p>
        </footer>
      </div>
    </>
  );
};

export default CoursePage;
