import { useState, useEffect, useRef } from "react";
import {
  BookOpen, Clock, Check, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  Play, FileText, HelpCircle, ClipboardCheck, Star, Gift, Download, Users,
  GripVertical, Plus, Trash2, Save, Loader2, Monitor, Trophy, ArrowRight,
  Award, Shield, MessageCircle, Upload, DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import EditableText from "./EditableText";
import CourseLandingPreview from "./CourseLandingPreview";
import {
  ExtendedCourse, LessonContent, LandingSectionType,
  getLayoutStyleConfig, formatSectionNumber, CourseLayoutStyle,
} from "@/types/course-pages";

// ── Types ────────────────────────────────────────────────────

type TabId =
  | "landing" | "curriculum" | "lesson" | "dashboard" | "pricing"
  | "bonuses" | "resources" | "community" | "testimonials";

interface CoursePreviewTabsProps {
  course: ExtendedCourse;
  onUpdate?: (course: ExtendedCourse) => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onRefine?: () => void;
  onOpenSettings?: () => void;
  onOpenPublishSettings?: () => void;
  onPreviewAsStudent?: () => void;
  onDuplicate?: () => void;
  onUploadThumbnail?: () => void;
  isPublishing?: boolean;
  isPublished?: boolean;
  isVisualEditMode?: boolean;
  logoUrl?: string;
  onUpdateLogo?: (url: string | undefined) => void;
  isCreatorView?: boolean;
  onSignIn?: () => void;
}

// ── Constants ────────────────────────────────────────────────

const SECTION_LABELS: Record<LandingSectionType, string> = {
  hero: "Hero", outcomes: "Learning Outcomes", curriculum: "Curriculum",
  instructor: "Instructor", pricing: "Pricing", faq: "FAQ",
  who_is_for: "Who Is This For", course_includes: "Course Includes",
  testimonials: "Testimonials", guarantee: "Guarantee", bonuses: "Bonuses",
  community: "Community", certificate: "Certificate",
};

const ALL_SECTIONS: LandingSectionType[] = Object.keys(SECTION_LABELS) as LandingSectionType[];

// ── Accent color system ──────────────────────────────────────

type AccentPalette = {
  bg: string; text: string; border: string; bgLight: string; borderLight: string;
};

const ACCENT_MAP: Record<CourseLayoutStyle, AccentPalette> = {
  creator: { bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500", bgLight: "bg-amber-500/10", borderLight: "border-amber-500/30" },
  technical: { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500", bgLight: "bg-emerald-500/10", borderLight: "border-emerald-500/30" },
  academic: { bg: "bg-blue-600", text: "text-blue-400", border: "border-blue-600", bgLight: "bg-blue-600/10", borderLight: "border-blue-600/30" },
  visual: { bg: "bg-violet-500", text: "text-violet-400", border: "border-violet-500", bgLight: "bg-violet-500/10", borderLight: "border-violet-500/30" },
};

// ── Helpers ──────────────────────────────────────────────────

const lessonTypeIcon = (type: LessonContent["type"]) => {
  switch (type) {
    case "video": case "text_video": return <Play className="h-3.5 w-3.5" />;
    case "quiz": return <HelpCircle className="h-3.5 w-3.5" />;
    case "assignment": return <ClipboardCheck className="h-3.5 w-3.5" />;
    default: return <FileText className="h-3.5 w-3.5" />;
  }
};

function loadGoogleFont(fontName: string) {
  if (!fontName || fontName === "Inter") return;
  const id = `gfont-${fontName.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

/** Convert hex color to "H S% L%" for Tailwind CSS variables. */
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
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function adjustHSLLightness(hsl: string, delta: number): string {
  const m = hsl.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!m) return hsl;
  const l = Math.max(0, Math.min(100, parseFloat(m[3]) + delta));
  return `${Math.round(parseFloat(m[1]))} ${Math.round(parseFloat(m[2]))}% ${Math.round(l)}%`;
}

/** Build Tailwind theme CSS variable overrides from design_config colors. */
function buildThemeOverrides(colors: NonNullable<ExtendedCourse["design_config"]>["colors"]): Record<string, string> {
  if (!colors) return {};
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
  if (colors.background) {
    vars["--background"] = hexToHSL(colors.background);
  }
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

// ── Component ────────────────────────────────────────────────

const CoursePreviewTabs = ({
  course, onUpdate, onPublish, onUnpublish, onRefine, onOpenSettings,
  onOpenPublishSettings, onPreviewAsStudent, onDuplicate, onUploadThumbnail,
  isPublishing = false, isPublished = false, isVisualEditMode = false,
  logoUrl, onUpdateLogo, isCreatorView = true, onSignIn,
}: CoursePreviewTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("landing");
  const [selectedModuleIdx, setSelectedModuleIdx] = useState(0);
  const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [landingSections, setLandingSections] = useState<LandingSectionType[]>(
    (course.section_order as LandingSectionType[]) ?? ["hero", "outcomes", "curriculum", "instructor", "faq"]
  );
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [editingLessonContent, setEditingLessonContent] = useState("");
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const layoutStyle = course.layout_style ?? "creator";
  const style = getLayoutStyleConfig(layoutStyle);
  const designColors = course.design_config?.colors;
  const designFonts = course.design_config?.fonts;

  // When design_config provides custom colors, use theme-variable-based Tailwind classes
  // (which get overridden by the CSS variable injection below).
  // Otherwise fall back to the hardcoded layout-style accent palette.
  const hasCustomColors = !!designColors?.primary;
  const accent: AccentPalette = hasCustomColors
    ? {
        bg: "bg-primary",
        text: "text-primary",
        border: "border-primary",
        bgLight: "bg-primary/10",
        borderLight: "border-primary/30",
      }
    : ACCENT_MAP[layoutStyle];

  // Override layout style classes when custom colors are active
  if (hasCustomColors) {
    style.headingClass = "text-foreground font-bold";
    style.cardClass = "bg-card border-border";
    style.primaryHex = designColors!.primary!;
  }
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const currentModule = course.modules[selectedModuleIdx];
  const currentLesson = currentModule?.lessons[selectedLessonIdx];
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons.size / totalLessons) * 100) : 0;

  const separatePages = course.separatePages ?? course.pages?.separatePages ?? [];
  const enabledPages = separatePages.filter((p) => p.isEnabled);

  const tabs: { id: TabId; label: string }[] = [
    { id: "landing", label: "Landing" },
    { id: "curriculum", label: "Curriculum" },
    { id: "lesson", label: "Lesson" },
    { id: "dashboard", label: "Dashboard" },
    ...enabledPages.map((p) => ({ id: p.type as TabId, label: p.title })),
    { id: "pricing", label: "Pricing" },
  ];

  // Load Google Fonts
  useEffect(() => {
    if (designFonts?.heading) loadGoogleFont(designFonts.heading);
    if (designFonts?.body) loadGoogleFont(designFonts.body);
  }, [designFonts?.heading, designFonts?.body]);

  // ── Helpers ──

  const updateCourseField = (field: string, value: any) => {
    onUpdate?.({ ...course, [field]: value });
  };

  const saveLayout = async () => {
    if (!course.id) return;
    setIsSavingLayout(true);
    const { error } = await supabase
      .from("courses")
      .update({ section_order: landingSections as any, updated_at: new Date().toISOString() } as any)
      .eq("id", course.id);
    setIsSavingLayout(false);
    if (error) toast.error("Failed to save layout");
    else { toast.success("Layout saved"); updateCourseField("section_order", landingSections); }
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const next = [...landingSections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setLandingSections(next);
  };

  const removeSection = (idx: number) => setLandingSections((prev) => prev.filter((_, i) => i !== idx));
  const addSection = (s: LandingSectionType) => { if (!landingSections.includes(s)) setLandingSections((prev) => [...prev, s]); };
  const markComplete = (lessonId: string) => setCompletedLessons((prev) => new Set(prev).add(lessonId));

  // Logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateLogo) return;
    setIsUploadingLogo(true);
    const path = `logos/${course.id ?? "temp"}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("course-thumbnails").upload(path, file, { upsert: true });
    if (error) { toast.error("Logo upload failed"); setIsUploadingLogo(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
    onUpdateLogo(publicUrl);
    setIsUploadingLogo(false);
  };

  // Build Tailwind theme overrides from design_config so ALL utility classes
  // (bg-background, text-foreground, text-primary, etc.) reflect the custom palette
  const themeOverrides = buildThemeOverrides(designColors);
  const cssVars: React.CSSProperties & Record<string, string> = {
    ...themeOverrides,
    ...(designFonts?.heading && { "--font-heading": `'${designFonts.heading}', serif` }),
    ...(designFonts?.body && { "--font-body": `'${designFonts.body}', sans-serif` }),
  } as any;

  // Resolve the effective primary color for inline styles (fallback to layout style)
  const effectivePrimary = designColors?.primary || style.primaryHex;

  // ── Render sections ──

  const renderHeroSection = () => {
    const heroBg = course.design_config?.heroImage || course.design_config?.backgrounds?.hero || course.thumbnail;
    const heroStyleVal = course.design_config?.heroStyle ?? "gradient";
    const heroLayout = course.design_config?.heroLayout ?? "left";
    const isSplit = heroLayout === "split";
    const isCentered = heroLayout === "centered";
    const isImageBg = heroLayout === "image_background";

    // Style-driven background rendering
    const renderBgLayers = () => {
      switch (heroStyleVal) {
        case "minimal":
          return <div className="absolute inset-0 bg-background" />;
        case "image":
          if (heroBg) {
            return (
              <>
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
                <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/40" />
              </>
            );
          }
          return <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${effectivePrimary}15 0%, transparent 60%)` }} />;
        case "gradient":
        default:
          if (heroBg && !isCentered) {
            return (
              <>
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
                <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/70" />
              </>
            );
          }
          return <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${effectivePrimary}22 0%, transparent 60%)` }} />;
      }
    };

    // Image-background layout override
    if (isImageBg && heroBg) {
      return (
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/75 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
          <div className={cn("relative z-10", style.containerClass)}>
            {isVisualEditMode ? (
              <>
                <EditableText value={course.title} onSave={(v) => updateCourseField("title", v)} as="h1" className="text-4xl font-bold mb-3" />
                <EditableText value={course.tagline ?? ""} onSave={(v) => updateCourseField("tagline", v)} as="p" className="text-lg text-muted-foreground mb-4" placeholder="Add a tagline…" />
                <EditableText value={course.description} onSave={(v) => updateCourseField("description", v)} as="p" className="text-muted-foreground mb-8" multiline placeholder="Add description…" />
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-foreground mb-3" style={{ fontFamily: designFonts?.heading }}>{course.title}</h1>
                {course.tagline && <p className="text-lg text-muted-foreground mb-4">{course.tagline}</p>}
                {course.description && <p className="text-muted-foreground mb-8 max-w-2xl">{course.description}</p>}
              </>
            )}
            <Button className={cn(accent.bg, "text-white hover:opacity-90")}>
              Enroll Now <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </section>
      );
    }

    // Split layout: text + image side by side
    if (isSplit) {
      return (
        <section className="relative py-16 overflow-hidden">
          {renderBgLayers()}
          <div className={cn("relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center", style.containerClass)}>
            <div>
              {isVisualEditMode ? (
                <>
                  <EditableText value={course.title} onSave={(v) => updateCourseField("title", v)} as="h1" className="text-4xl font-bold mb-3" />
                  <EditableText value={course.tagline ?? ""} onSave={(v) => updateCourseField("tagline", v)} as="p" className="text-lg text-muted-foreground mb-4" placeholder="Add a tagline…" />
                  <EditableText value={course.description} onSave={(v) => updateCourseField("description", v)} as="p" className="text-muted-foreground mb-8" multiline placeholder="Add description…" />
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-bold text-foreground mb-3" style={{ fontFamily: designFonts?.heading }}>{course.title}</h1>
                  {course.tagline && <p className="text-lg text-muted-foreground mb-4">{course.tagline}</p>}
                  {course.description && <p className="text-muted-foreground mb-8 max-w-2xl">{course.description}</p>}
                </>
              )}
              <Button className={cn(accent.bg, "text-white hover:opacity-90")}>
                Enroll Now <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            {heroBg ? (
              <div className="rounded-xl overflow-hidden shadow-lg aspect-[4/3]">
                <img src={heroBg} alt={course.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden aspect-[4/3] bg-muted/30 border border-border flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/20" />
              </div>
            )}
          </div>
        </section>
      );
    }

    // Left / Centered / Default
    return (
      <section className={cn("relative py-16 overflow-hidden", heroStyleVal === "minimal" && "border-b border-border")}>
        {renderBgLayers()}
        <div className={cn("relative z-10", style.containerClass, isCentered && "text-center")}>
          {isVisualEditMode ? (
            <>
              <EditableText value={course.title} onSave={(v) => updateCourseField("title", v)} as="h1" className="text-4xl font-bold mb-3" />
              <EditableText value={course.tagline ?? ""} onSave={(v) => updateCourseField("tagline", v)} as="p" className="text-lg text-muted-foreground mb-4" placeholder="Add a tagline…" />
              <EditableText value={course.description} onSave={(v) => updateCourseField("description", v)} as="p" className={cn("text-muted-foreground mb-8", isCentered ? "max-w-2xl mx-auto" : "max-w-2xl")} multiline placeholder="Add description…" />
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-foreground mb-3" style={{ fontFamily: designFonts?.heading }}>{course.title}</h1>
              {course.tagline && <p className="text-lg text-muted-foreground mb-4">{course.tagline}</p>}
              {course.description && <p className={cn("text-muted-foreground mb-8", isCentered ? "max-w-2xl mx-auto" : "max-w-2xl")}>{course.description}</p>}
            </>
          )}
          <Button className={cn(accent.bg, "text-white hover:opacity-90", isCentered && "mx-auto")}>
            Enroll Now <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          {/* Centered layout: show image below */}
          {isCentered && heroBg && (
            <div className="mt-8 max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg">
              <img src={heroBg} alt={course.title} className="w-full h-auto object-cover max-h-[300px]" />
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderOutcomesSection = () => {
    if (!course.learningOutcomes?.length) return null;
    return (
      <section className="py-12">
        <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>What You'll Learn</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {course.learningOutcomes.map((o, i) => (
            <div key={i} className="flex items-start gap-3">
              <Check className={cn("h-4 w-4 mt-0.5 shrink-0", accent.text)} />
              <span className="text-sm text-foreground">{o}</span>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderCurriculumSection = () => (
    <section className="py-12">
      <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>Curriculum</h2>
      <Accordion type="multiple" className="w-full">
        {course.modules.map((mod, mIdx) => (
          <AccordionItem key={mod.id} value={mod.id}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 text-left">
                <span className={cn("text-xs font-mono px-1.5 py-0.5 rounded", accent.bgLight, accent.text)}>
                  {formatSectionNumber(mIdx)}
                </span>
                <span className="font-medium text-foreground text-sm">{mod.title}</span>
                <Badge variant="outline" className="ml-auto mr-2 text-xs">{mod.lessons.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1.5 pl-2">
                {mod.lessons.map((l, lIdx) => (
                  <li key={l.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    {lessonTypeIcon(l.type)}
                    <span className="text-xs font-mono w-8">{formatSectionNumber(mIdx, lIdx)}</span>
                    <span className="flex-1 text-foreground">{l.title}</span>
                    {l.duration && <Badge variant="outline" className="text-xs">{l.duration}</Badge>}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );

  const renderInstructorSection = () => {
    if (!course.pages?.instructor) return null;
    return (
      <section className="py-12">
        <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>Your Instructor</h2>
        <Card className={style.cardClass}>
          <CardContent className="pt-6 flex items-start gap-4">
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center shrink-0", accent.bgLight)}>
              <span className={cn("text-lg font-bold", accent.text)}>{course.pages.instructor.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{course.pages.instructor.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{course.pages.instructor.bio}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  };

  const renderTestimonialsSection = () => (
    <section className="py-12">
      <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>Student Reviews</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["Great course!", "Learned so much.", "Highly recommend."].map((text, i) => (
          <Card key={i} className={style.cardClass}>
            <CardContent className="pt-5">
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className={cn("h-3.5 w-3.5 fill-current", accent.text)} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">"{text}"</p>
              <p className="text-xs text-foreground mt-2">Student {i + 1}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );

  const renderFaqSection = () => {
    if (!course.pages?.faq?.length) return null;
    return (
      <section className="py-12">
        <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>FAQ</h2>
        <Accordion type="single" collapsible className="w-full">
          {course.pages.faq.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-sm text-foreground">{item.question}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    );
  };

  const renderGuaranteeSection = () => (
    <section className="py-12 text-center">
      <Shield className={cn("h-10 w-10 mx-auto mb-3", accent.text)} />
      <h2 className={cn("text-2xl font-bold mb-2", style.headingClass)}>Money-Back Guarantee</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        If you're not satisfied within 30 days, we'll refund your purchase — no questions asked.
      </p>
    </section>
  );

  const renderBonusesSection = () => {
    if (!course.pages?.included_bonuses?.length) return null;
    return (
      <section className="py-12">
        <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>Bonuses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {course.pages.included_bonuses.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-foreground">
              <Gift className={cn("h-4 w-4 shrink-0", accent.text)} /> {b}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderCommunitySection = () => (
    <section className="py-12 text-center">
      <Users className={cn("h-10 w-10 mx-auto mb-3", accent.text)} />
      <h2 className={cn("text-2xl font-bold mb-2", style.headingClass)}>Join the Community</h2>
      <p className="text-sm text-muted-foreground">Connect with fellow students and get support.</p>
    </section>
  );

  const renderCertificateSection = () => (
    <section className="py-12 text-center">
      <Award className={cn("h-10 w-10 mx-auto mb-3", accent.text)} />
      <h2 className={cn("text-2xl font-bold mb-2", style.headingClass)}>Earn Your Certificate</h2>
      <p className="text-sm text-muted-foreground">Complete the course to receive a shareable certificate.</p>
    </section>
  );

  const renderPricingLandingSection = () => (
    <section className="py-12 text-center">
      <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>Enroll Now</h2>
      <Card className={cn(style.cardClass, "max-w-sm mx-auto")}>
        <CardContent className="pt-6 text-center">
          <p className="text-3xl font-bold text-foreground mb-2">
            {course.pages?.pricing ? `$${course.pages.pricing.price}` : "Free"}
          </p>
          <Button className={cn("w-full mt-4", accent.bg, "text-white hover:opacity-90")}>Get Started</Button>
        </CardContent>
      </Card>
    </section>
  );

  const renderWhoIsForSection = () => {
    if (!course.pages?.target_audience) return null;
    return (
      <section className="py-12">
        <h2 className={cn("text-2xl font-bold mb-4", style.headingClass)}>Who Is This For?</h2>
        <p className="text-sm text-muted-foreground">{course.pages.target_audience}</p>
      </section>
    );
  };

  const renderCourseIncludesSection = () => (
    <section className="py-12">
      <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>Course Includes</h2>
      <div className="grid grid-cols-2 gap-3 text-sm text-foreground">
        <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /> {course.modules.length} modules</div>
        <div className="flex items-center gap-2"><Play className="h-4 w-4 text-muted-foreground" /> {totalLessons} lessons</div>
        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {course.duration_weeks} weeks</div>
        <div className="flex items-center gap-2"><Award className="h-4 w-4 text-muted-foreground" /> Certificate</div>
      </div>
    </section>
  );

  const SECTION_RENDERERS: Record<LandingSectionType, () => React.ReactNode> = {
    hero: renderHeroSection,
    outcomes: renderOutcomesSection,
    curriculum: renderCurriculumSection,
    instructor: renderInstructorSection,
    pricing: renderPricingLandingSection,
    faq: renderFaqSection,
    who_is_for: renderWhoIsForSection,
    course_includes: renderCourseIncludesSection,
    testimonials: renderTestimonialsSection,
    guarantee: renderGuaranteeSection,
    bonuses: renderBonusesSection,
    community: renderCommunitySection,
    certificate: renderCertificateSection,
  };

  // ── Curriculum tab module layouts ──

  const renderTimelineModules = () => (
    <div className="relative pl-6 space-y-6">
      <div className="absolute left-2.5 top-0 bottom-0 w-px" style={{ backgroundColor: `${effectivePrimary}40` }} />
      {course.modules.map((mod, mIdx) => (
        <div key={mod.id} className="relative">
          <div className={cn("absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white", accent.bg)}>
            {mIdx + 1}
          </div>
          <Card className={style.cardClass}>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-foreground text-sm mb-1">{mod.title}</h3>
              {mod.description && <p className="text-xs text-muted-foreground mb-2">{mod.description}</p>}
              <ul className="space-y-1">
                {mod.lessons.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    {lessonTypeIcon(l.type)} <span className="text-foreground">{l.title}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );

  const renderAccordionModules = () => (
    <Accordion type="multiple" className="w-full">
      {course.modules.map((mod, mIdx) => (
        <AccordionItem key={mod.id} value={mod.id}>
          <AccordionTrigger className={cn("hover:no-underline", style.fontStyle)}>
            <span className="text-sm font-medium text-foreground">{formatSectionNumber(mIdx)} {mod.title}</span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className={cn("space-y-1.5", style.fontStyle)}>
              {mod.lessons.map((l, lIdx) => (
                <li key={l.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  {lessonTypeIcon(l.type)}
                  <span className="font-mono">{formatSectionNumber(mIdx, lIdx)}</span>
                  <span className="text-foreground">{l.title}</span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  const renderNumberedModules = () => (
    <div className="space-y-4">
      {course.modules.map((mod, mIdx) => (
        <Card key={mod.id} className={style.cardClass}>
          <CardContent className="pt-4">
            <div className="flex items-baseline gap-3 mb-2">
              <span className={cn("text-2xl font-bold", accent.text, style.headingFont)}>{formatSectionNumber(mIdx)}</span>
              <h3 className={cn("font-semibold text-foreground", style.headingFont)}>{mod.title}</h3>
            </div>
            <ul className="space-y-1 pl-10">
              {mod.lessons.map((l, lIdx) => (
                <li key={l.id} className="text-sm text-muted-foreground">
                  <span className="font-mono text-xs mr-2">{formatSectionNumber(mIdx, lIdx)}</span> {l.title}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderGridModules = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {course.modules.map((mod) => (
        <Card key={mod.id} className={cn(style.cardClass, style.cardRadius, "overflow-hidden")}>
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${effectivePrimary}, ${effectivePrimary}88)` }} />
          <CardContent className="pt-4">
            <h3 className="font-semibold text-foreground text-sm mb-2">{mod.title}</h3>
            <ul className="space-y-1">
              {mod.lessons.map((l) => (
                <li key={l.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  {lessonTypeIcon(l.type)} <span className="text-foreground">{l.title}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const MODULE_LAYOUT_RENDERERS: Record<string, () => React.ReactNode> = {
    timeline: renderTimelineModules,
    accordion: renderAccordionModules,
    numbered: renderNumberedModules,
    grid: renderGridModules,
  };

  // ── RENDER ────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background text-foreground" style={cssVars}>
      {/* ══ Navbar — h-20, 56px logo ══ */}
      <nav className="flex items-center h-20 border-b border-border px-6 shrink-0">
        {/* Left — Logo */}
        <div className="flex items-center gap-3 shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-lg object-cover" />
          ) : (
            <button
              onClick={() => logoInputRef.current?.click()}
              className={cn("w-14 h-14 rounded-lg flex items-center justify-center border-2 border-dashed transition-colors", accent.borderLight, "hover:border-primary")}
            >
              {isUploadingLogo ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          )}
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>

        {/* Center — Navigation links */}
        <div className="hidden md:flex items-center justify-center gap-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-4 py-2 text-sm transition-colors",
                activeTab === tab.id
                  ? cn("font-medium text-foreground")
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full", accent.bg)} />
              )}
            </button>
          ))}
        </div>

        {/* Mobile dropdown */}
        <div className="md:hidden flex-1 px-4">
          <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>{tab.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right — Role-based actions (public view only) */}
        <div className="flex items-center gap-2 shrink-0">
          {!isCreatorView && onSignIn && (
            <Button size="sm" variant="ghost" className="text-xs h-8" onClick={onSignIn}>Sign In</Button>
          )}
        </div>
      </nav>

      {/* ══ Tab Content ══ */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* ═══ LANDING ═══ */}
          {activeTab === "landing" && (
            <div className="space-y-0">

              {isEditMode ? (
                <div className="space-y-2">
                  {landingSections.map((section, idx) => (
                    <div key={section} className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/20">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-sm text-foreground flex-1">{SECTION_LABELS[section]}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveSection(idx, -1)} disabled={idx === 0}>
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveSection(idx, 1)} disabled={idx === landingSections.length - 1}>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeSection(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {ALL_SECTIONS.filter((s) => !landingSections.includes(s)).map((s) => (
                      <Button key={s} size="sm" variant="outline" className="text-xs h-7" onClick={() => addSection(s)}>
                        <Plus className="h-3 w-3 mr-1" /> {SECTION_LABELS[s]}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Use the SAME CourseLandingPreview component as the published page
                   so the builder landing tab is a 1:1 match of what students see */
                <CourseLandingPreview
                  course={{ ...course, section_order: landingSections }}
                  onUpdate={onUpdate}
                  onEnrollClick={() => {}}
                />
              )}
            </div>
          )}

          {/* ═══ CURRICULUM ═══ */}
          {activeTab === "curriculum" && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{course.duration_weeks} weeks</Badge>
                <Badge variant="secondary"><BookOpen className="h-3 w-3 mr-1" />{totalLessons} lessons</Badge>
              </div>
              {MODULE_LAYOUT_RENDERERS[style.moduleLayout]?.()}
            </div>
          )}

          {/* ═══ LESSON ═══ */}
          {activeTab === "lesson" && currentModule && currentLesson && (
            <div className="grid grid-cols-[438px_1fr] gap-0 min-h-[500px]">
              {/* Fixed 438px sidebar */}
              <div className="border-r border-border pr-4 overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Modules</p>
                {course.modules.map((mod, mIdx) => (
                  <div key={mod.id} className="mb-3">
                    <button
                      onClick={() => { setSelectedModuleIdx(mIdx); setSelectedLessonIdx(0); }}
                      className={cn("text-sm font-medium w-full text-left py-1.5 px-2 rounded transition-colors",
                        mIdx === selectedModuleIdx ? cn(accent.bgLight, accent.text) : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      {mod.title}
                    </button>
                    {mIdx === selectedModuleIdx && (
                      <div className="ml-3 space-y-0.5 mt-1 border-l-2 pl-3" style={{ borderColor: `${effectivePrimary}40` }}>
                        {mod.lessons.map((l, lIdx) => (
                          <button
                            key={l.id}
                            onClick={() => setSelectedLessonIdx(lIdx)}
                            className={cn("flex items-center gap-2 text-xs w-full text-left py-1 px-1.5 rounded transition-colors",
                              lIdx === selectedLessonIdx ? cn(accent.bgLight, "text-foreground") : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {completedLessons.has(l.id) ? <Check className="h-3 w-3 text-emerald-500" /> : lessonTypeIcon(l.type)}
                            <span className="truncate">{l.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Main lesson content */}
              <div className="pl-6 space-y-4">
                <div>
                  {isVisualEditMode ? (
                    <EditableText
                      value={currentLesson.title}
                      onSave={(v) => {
                        const updated = { ...course };
                        updated.modules[selectedModuleIdx].lessons[selectedLessonIdx].title = v;
                        onUpdate?.(updated);
                      }}
                      as="h2"
                      className="text-xl font-bold"
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-foreground">{currentLesson.title}</h2>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{currentLesson.type}</Badge>
                    {currentLesson.duration && <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />{currentLesson.duration}</Badge>}
                  </div>
                </div>

                {isEditingLesson ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-foreground">Type</Label>
                      <Select
                        value={currentLesson.type}
                        onValueChange={(v) => {
                          const updated = { ...course };
                          updated.modules[selectedModuleIdx].lessons[selectedLessonIdx].type = v as LessonContent["type"];
                          onUpdate?.(updated);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="text_video">Text + Video</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="assignment">Assignment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-foreground">Content</Label>
                      <Textarea value={editingLessonContent} onChange={(e) => setEditingLessonContent(e.target.value)} rows={10} className="text-sm font-mono" />
                    </div>
                    {(currentLesson.type === "video" || currentLesson.type === "text_video") && (
                      <div className="space-y-2">
                        <Label className="text-xs text-foreground">Video URL</Label>
                        <Input
                          value={currentLesson.video_url ?? ""}
                          onChange={(e) => {
                            const updated = { ...course };
                            updated.modules[selectedModuleIdx].lessons[selectedLessonIdx].video_url = e.target.value;
                            onUpdate?.(updated);
                          }}
                          className="text-xs"
                          placeholder="https://youtube.com/... or https://vimeo.com/..."
                        />
                      </div>
                    )}
                    {currentLesson.type === "quiz" && (
                      <div className="space-y-3">
                        <Label className="text-xs text-foreground">Passing Score: {currentLesson.passing_score ?? 70}%</Label>
                        <Slider
                          value={[currentLesson.passing_score ?? 70]}
                          onValueChange={([v]) => {
                            const updated = { ...course };
                            updated.modules[selectedModuleIdx].lessons[selectedLessonIdx].passing_score = v;
                            onUpdate?.(updated);
                          }}
                          min={50} max={100} step={5}
                        />
                        <p className="text-xs text-muted-foreground">{currentLesson.quiz_questions?.length ?? 0} questions</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="text-xs" onClick={() => {
                        const updated = { ...course };
                        updated.modules[selectedModuleIdx].lessons[selectedLessonIdx].content_markdown = editingLessonContent;
                        onUpdate?.(updated);
                        setIsEditingLesson(false);
                      }}>Save</Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setIsEditingLesson(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(currentLesson.type === "video" || currentLesson.type === "text_video") && (
                      <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center border border-border">
                        {currentLesson.video_url ? (
                          <iframe src={currentLesson.video_url} className="w-full h-full rounded-lg" allowFullScreen />
                        ) : (
                          <Monitor className="h-8 w-8 text-muted-foreground/40" />
                        )}
                      </div>
                    )}
                    <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {currentLesson.content_markdown || currentLesson.description || "No content yet. Click 'Edit Content' to add your lesson material."}
                    </div>
                    {isCreatorView && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                        setEditingLessonContent(currentLesson.content_markdown || currentLesson.description || "");
                        setIsEditingLesson(true);
                      }}>Edit Content</Button>
                    )}
                  </div>
                )}

                <Separator />
                <div className="flex items-center justify-between">
                  <Button
                    size="sm" variant="outline" className="text-xs"
                    disabled={selectedLessonIdx === 0 && selectedModuleIdx === 0}
                    onClick={() => {
                      if (selectedLessonIdx > 0) setSelectedLessonIdx(selectedLessonIdx - 1);
                      else if (selectedModuleIdx > 0) {
                        setSelectedModuleIdx(selectedModuleIdx - 1);
                        setSelectedLessonIdx(course.modules[selectedModuleIdx - 1].lessons.length - 1);
                      }
                    }}
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" /> Previous
                  </Button>
                  <Button
                    size="sm"
                    variant={completedLessons.has(currentLesson.id) ? "secondary" : "default"}
                    className={cn("text-xs", !completedLessons.has(currentLesson.id) && accent.bg, !completedLessons.has(currentLesson.id) && "text-white")}
                    onClick={() => markComplete(currentLesson.id)}
                  >
                    {completedLessons.has(currentLesson.id) ? <><Check className="h-3 w-3 mr-1" />Done</> : "Mark Complete"}
                  </Button>
                  <Button
                    size="sm" variant="outline" className="text-xs"
                    disabled={selectedModuleIdx === course.modules.length - 1 && selectedLessonIdx === currentModule.lessons.length - 1}
                    onClick={() => {
                      if (selectedLessonIdx < currentModule.lessons.length - 1) setSelectedLessonIdx(selectedLessonIdx + 1);
                      else if (selectedModuleIdx < course.modules.length - 1) { setSelectedModuleIdx(selectedModuleIdx + 1); setSelectedLessonIdx(0); }
                    }}
                  >
                    Next <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ DASHBOARD ═══ */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-foreground">Welcome back!</h2>
                <p className="text-sm text-muted-foreground">Continue where you left off in {course.title}</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Overall Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {progressPercent >= 100 ? (
                <Card className={cn(accent.borderLight, accent.bgLight)}>
                  <CardContent className="pt-6 text-center">
                    <Trophy className={cn("h-10 w-10 mx-auto mb-2", accent.text)} />
                    <h3 className="text-lg font-bold text-foreground">Course Complete!</h3>
                    <p className="text-sm text-muted-foreground">Congratulations! You've completed all lessons.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className={style.cardClass}>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground mb-1">Continue Learning</p>
                    <p className="text-sm font-medium text-foreground">{course.modules[0]?.lessons[0]?.title ?? "Start the course"}</p>
                    <Button size="sm" className={cn("mt-2 text-xs", accent.bg, "text-white hover:opacity-90")}>
                      Continue <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: completedLessons.size, label: "Completed" },
                  { value: totalLessons, label: "Total Lessons" },
                  { value: course.modules.length, label: "Modules" },
                  { value: course.duration_weeks, label: "Est. Weeks" },
                ].map((stat) => (
                  <Card key={stat.label} className="border-border/40">
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Module Progress</h3>
                {course.modules.map((mod) => {
                  const done = mod.lessons.filter((l) => completedLessons.has(l.id)).length;
                  const pct = mod.lessons.length > 0 ? Math.round((done / mod.lessons.length) * 100) : 0;
                  return (
                    <div key={mod.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground">{mod.title}</span>
                        <span className="text-muted-foreground">{done}/{mod.lessons.length}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ PRICING ═══ */}
          {activeTab === "pricing" && (
            <div className="space-y-8 max-w-2xl mx-auto py-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Plan</h2>
                <p className="text-muted-foreground">Invest in your growth with {course.title}</p>
              </div>

              <Card className={cn(style.cardClass, accent.borderLight)}>
                <CardContent className="pt-8 pb-8">
                  <div className="text-center mb-6">
                    <p className="text-4xl font-bold text-foreground">
                      {course.pages?.pricing ? `$${course.pages.pricing.price}` : "Free"}
                    </p>
                    {course.pages?.pricing?.original_price && (
                      <p className="text-sm text-muted-foreground line-through mt-1">
                        ${course.pages.pricing.original_price}
                      </p>
                    )}
                  </div>

                  <Separator className="my-6" />

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm text-foreground"><Check className={cn("h-4 w-4", accent.text)} /> {course.modules.length} modules, {totalLessons} lessons</li>
                    <li className="flex items-center gap-2 text-sm text-foreground"><Check className={cn("h-4 w-4", accent.text)} /> {course.duration_weeks} weeks of content</li>
                    <li className="flex items-center gap-2 text-sm text-foreground"><Check className={cn("h-4 w-4", accent.text)} /> Lifetime access</li>
                    <li className="flex items-center gap-2 text-sm text-foreground"><Check className={cn("h-4 w-4", accent.text)} /> Certificate of completion</li>
                    {course.pages?.included_bonuses?.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground"><Gift className={cn("h-4 w-4", accent.text)} /> {b}</li>
                    ))}
                  </ul>

                  <Button className={cn("w-full", accent.bg, "text-white hover:opacity-90")} size="lg">
                    <DollarSign className="h-4 w-4 mr-1" /> Enroll Now
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-3">30-day money-back guarantee</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ BONUSES ═══ */}
          {activeTab === "bonuses" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Bonuses</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(course.pages?.included_bonuses ?? ["Bonus workbook", "Community access", "1-on-1 coaching"]).map((bonus, i) => (
                  <Card key={i} className={style.cardClass}>
                    <CardContent className="pt-4 flex items-center gap-3">
                      <Gift className={cn("h-5 w-5 shrink-0", accent.text)} />
                      <span className="text-sm text-foreground">{bonus}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ═══ RESOURCES ═══ */}
          {activeTab === "resources" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Resources</h2>
              <div className="space-y-2">
                {["Course Workbook.pdf", "Templates Pack.zip", "Cheat Sheet.pdf"].map((file, i) => (
                  <Card key={i} className="border-border/40">
                    <CardContent className="pt-4 flex items-center gap-3">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground flex-1">{file}</span>
                      <Button size="sm" variant="outline" className="text-xs">Download</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ═══ COMMUNITY ═══ */}
          {activeTab === "community" && (
            <div className="space-y-6 text-center py-10">
              <MessageCircle className={cn("h-12 w-12 mx-auto", accent.text)} />
              <h2 className="text-xl font-bold text-foreground">Community</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">Connect with fellow students.</p>
            </div>
          )}

          {/* ═══ TESTIMONIALS ═══ */}
          {activeTab === "testimonials" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">What Students Say</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["Amazing course!", "Best investment I've made.", "Transformed my skills."].map((text, i) => (
                  <Card key={i} className={style.cardClass}>
                    <CardContent className="pt-5">
                      <div className="flex gap-0.5 mb-2">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className={cn("h-3.5 w-3.5 fill-current", accent.text)} />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">"{text}"</p>
                      <p className="text-xs font-medium text-foreground">Student {i + 1}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CoursePreviewTabs;
