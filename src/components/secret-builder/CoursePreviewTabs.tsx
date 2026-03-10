import { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  Check,
  ChevronRight,
  ChevronLeft,
  Play,
  FileText,
  HelpCircle,
  ClipboardCheck,
  Star,
  Gift,
  Download,
  Users,
  GripVertical,
  Plus,
  Trash2,
  Save,
  Loader2,
  Monitor,
  Trophy,
  ArrowRight,
  Award,
  Shield,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import EditableText from "./EditableText";
import {
  ExtendedCourse,
  LessonContent,
  ModuleWithContent,
  LandingSectionType,
  getLayoutStyleConfig,
  formatSectionNumber,
  calculateModuleDuration,
} from "@/types/course-pages";

// ── Types ────────────────────────────────────────────────────

type TabId =
  | "landing"
  | "curriculum"
  | "lesson"
  | "dashboard"
  | "pricing"
  | "bonuses"
  | "resources"
  | "community"
  | "testimonials";

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

const SECTION_LABELS: Record<LandingSectionType, string> = {
  hero: "Hero",
  outcomes: "Learning Outcomes",
  curriculum: "Curriculum",
  instructor: "Instructor",
  pricing: "Pricing",
  faq: "FAQ",
  who_is_for: "Who Is This For",
  course_includes: "Course Includes",
  testimonials: "Testimonials",
  guarantee: "Guarantee",
  bonuses: "Bonuses",
  community: "Community",
  certificate: "Certificate",
};

const ALL_SECTIONS: LandingSectionType[] = Object.keys(SECTION_LABELS) as LandingSectionType[];

const lessonTypeIcon = (type: LessonContent["type"]) => {
  switch (type) {
    case "video":
    case "text_video":
      return <Play className="h-3.5 w-3.5" />;
    case "quiz":
      return <HelpCircle className="h-3.5 w-3.5" />;
    case "assignment":
      return <ClipboardCheck className="h-3.5 w-3.5" />;
    default:
      return <FileText className="h-3.5 w-3.5" />;
  }
};

// ── Component ────────────────────────────────────────────────

const CoursePreviewTabs = ({
  course,
  onUpdate,
  onPublish,
  onUnpublish,
  onRefine,
  onOpenSettings,
  onOpenPublishSettings,
  onPreviewAsStudent,
  onDuplicate,
  onUploadThumbnail,
  isPublishing = false,
  isPublished = false,
  isVisualEditMode = false,
  logoUrl,
  onUpdateLogo,
  isCreatorView = true,
  onSignIn,
}: CoursePreviewTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("landing");
  const [selectedModuleIdx, setSelectedModuleIdx] = useState(0);
  const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [landingSections, setLandingSections] = useState<LandingSectionType[]>(
    (course.section_order as LandingSectionType[]) ?? ["hero", "outcomes", "curriculum", "instructor", "faq"]
  );
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [editingLessonContent, setEditingLessonContent] = useState<string>("");
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const style = getLayoutStyleConfig(course.layout_style ?? "creator");
  const designColors = course.design_config?.colors;
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
  ];

  // ── Helpers ──

  const updateCourseField = (field: string, value: any) => {
    if (onUpdate) {
      onUpdate({ ...course, [field]: value });
    }
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
    else {
      toast.success("Layout saved");
      updateCourseField("section_order", landingSections);
    }
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const next = [...landingSections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setLandingSections(next);
  };

  const removeSection = (idx: number) => {
    setLandingSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSection = (section: LandingSectionType) => {
    if (!landingSections.includes(section)) {
      setLandingSections((prev) => [...prev, section]);
    }
  };

  const markComplete = (lessonId: string) => {
    setCompletedLessons((prev) => new Set(prev).add(lessonId));
  };

  // ── Inline CSS vars from DesignConfig ──
  const cssVars: React.CSSProperties = {
    ...(designColors?.primary && { "--course-primary": designColors.primary } as any),
    ...(designColors?.background && { "--course-bg": designColors.background } as any),
    ...(designColors?.text && { "--course-text": designColors.text } as any),
  };

  // ── Render ──

  return (
    <div className="flex flex-col h-full bg-background text-foreground" style={cssVars}>
      {/* ── Navigation Bar ── */}
      <div className="flex items-center border-b border-border px-4 h-12 shrink-0">
        <div className="flex items-center gap-2 mr-4">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-6 w-6 rounded" />
          ) : (
            <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary">C</span>
            </div>
          )}
        </div>

        {/* Desktop tabs */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md transition-colors",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile dropdown */}
        <div className="md:hidden flex-1">
          <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>{tab.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          {isCreatorView && (
            <>
              {isPublished ? (
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={onUnpublish}>
                  Unpublish
                </Button>
              ) : (
                onSignIn && (
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={onSignIn}>
                    Sign In
                  </Button>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* ════════ LANDING ════════ */}
          {activeTab === "landing" && (
            <div className="space-y-8">
              {/* Edit mode controls */}
              {isCreatorView && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isEditMode ? "default" : "outline"}
                    className="text-xs h-7"
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    {isEditMode ? "Done Editing" : "Edit Layout"}
                  </Button>
                  {isEditMode && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={saveLayout} disabled={isSavingLayout}>
                      {isSavingLayout ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                      Save Layout
                    </Button>
                  )}
                </div>
              )}

              {isEditMode ? (
                <div className="space-y-2">
                  {landingSections.map((section, idx) => (
                    <div key={section} className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/20">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-sm text-foreground flex-1">{SECTION_LABELS[section]}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveSection(idx, -1)} disabled={idx === 0}>
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveSection(idx, 1)} disabled={idx === landingSections.length - 1}>
                        <ChevronRight className="h-3 w-3" />
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
                <>
                  {landingSections.map((section) => (
                    <div key={section}>
                      {/* Hero */}
                      {section === "hero" && (
                        <section className="py-12" style={{ background: `linear-gradient(135deg, ${style.primaryHex}22 0%, transparent 60%)` }}>
                          <div className={style.containerClass}>
                            {isVisualEditMode ? (
                              <>
                                <EditableText value={course.title} onSave={(v) => updateCourseField("title", v)} as="h1" className="text-3xl font-bold mb-2" />
                                <EditableText value={course.tagline ?? ""} onSave={(v) => updateCourseField("tagline", v)} as="p" className="text-lg text-muted-foreground mb-3" placeholder="Add a tagline…" />
                                <EditableText value={course.description} onSave={(v) => updateCourseField("description", v)} as="p" className="text-muted-foreground mb-6" multiline placeholder="Add description…" />
                              </>
                            ) : (
                              <>
                                <h1 className="text-3xl font-bold text-foreground mb-2">{course.title}</h1>
                                {course.tagline && <p className="text-lg text-muted-foreground mb-3">{course.tagline}</p>}
                                {course.description && <p className="text-muted-foreground mb-6">{course.description}</p>}
                              </>
                            )}
                            <Button style={{ backgroundColor: style.primaryHex }} className="text-white hover:opacity-90">
                              Enroll Now <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </section>
                      )}

                      {/* Outcomes */}
                      {section === "outcomes" && course.learningOutcomes && course.learningOutcomes.length > 0 && (
                        <section className="py-10">
                          <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>What You'll Learn</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {course.learningOutcomes.map((o, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: style.primaryHex }} />
                                <span className="text-sm text-foreground">{o}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Curriculum */}
                      {section === "curriculum" && (
                        <section className="py-10">
                          <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>Curriculum</h2>
                          <Accordion type="multiple" className="w-full">
                            {course.modules.map((mod, mIdx) => (
                              <AccordionItem key={mod.id} value={mod.id}>
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-2 text-left">
                                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${style.primaryHex}22`, color: style.primaryHex }}>
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
                                        <span className="text-xs font-mono w-6">{formatSectionNumber(mIdx, lIdx)}</span>
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
                      )}

                      {/* Instructor */}
                      {section === "instructor" && course.pages?.instructor && (
                        <section className="py-10">
                          <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>Your Instructor</h2>
                          <Card className={style.cardClass}>
                            <CardContent className="pt-6 flex items-start gap-4">
                              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <span className="text-lg font-bold text-primary">
                                  {course.pages.instructor.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">{course.pages.instructor.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{course.pages.instructor.bio}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </section>
                      )}

                      {/* Testimonials */}
                      {section === "testimonials" && (
                        <section className="py-10">
                          <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>Student Reviews</h2>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {["Great course!", "Learned so much.", "Highly recommend."].map((text, i) => (
                              <Card key={i} className={style.cardClass}>
                                <CardContent className="pt-5">
                                  <div className="flex gap-0.5 mb-2">
                                    {Array.from({ length: 5 }).map((_, s) => (
                                      <Star key={s} className="h-3.5 w-3.5 fill-primary text-primary" />
                                    ))}
                                  </div>
                                  <p className="text-sm text-muted-foreground">"{text}"</p>
                                  <p className="text-xs text-foreground mt-2">Student {i + 1}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* FAQ */}
                      {section === "faq" && course.pages?.faq && course.pages.faq.length > 0 && (
                        <section className="py-10">
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
                      )}

                      {/* Guarantee */}
                      {section === "guarantee" && (
                        <section className="py-10 text-center">
                          <Shield className="h-10 w-10 mx-auto mb-3 text-primary" />
                          <h2 className={cn("text-2xl font-bold mb-2", style.headingClass)}>Money-Back Guarantee</h2>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            If you're not satisfied within 30 days, we'll refund your purchase — no questions asked.
                          </p>
                        </section>
                      )}

                      {/* Bonuses */}
                      {section === "bonuses" && course.pages?.included_bonuses && (
                        <section className="py-10">
                          <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>Bonuses</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {course.pages.included_bonuses.map((b, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                                <Gift className="h-4 w-4 shrink-0" style={{ color: style.primaryHex }} /> {b}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Community */}
                      {section === "community" && (
                        <section className="py-10 text-center">
                          <Users className="h-10 w-10 mx-auto mb-3 text-primary" />
                          <h2 className={cn("text-2xl font-bold mb-2", style.headingClass)}>Join the Community</h2>
                          <p className="text-sm text-muted-foreground">Connect with fellow students and get support.</p>
                        </section>
                      )}

                      {/* Certificate */}
                      {section === "certificate" && (
                        <section className="py-10 text-center">
                          <Award className="h-10 w-10 mx-auto mb-3 text-primary" />
                          <h2 className={cn("text-2xl font-bold mb-2", style.headingClass)}>Earn Your Certificate</h2>
                          <p className="text-sm text-muted-foreground">Complete the course to receive a shareable certificate.</p>
                        </section>
                      )}

                      {/* Pricing */}
                      {section === "pricing" && (
                        <section className="py-10 text-center">
                          <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>Enroll Now</h2>
                          <Card className={cn(style.cardClass, "max-w-sm mx-auto")}>
                            <CardContent className="pt-6 text-center">
                              <p className="text-3xl font-bold text-foreground mb-2">
                                {course.pages?.pricing ? `$${course.pages.pricing.price}` : "Free"}
                              </p>
                              <Button className="w-full mt-4" style={{ backgroundColor: style.primaryHex }}>
                                Get Started
                              </Button>
                            </CardContent>
                          </Card>
                        </section>
                      )}

                      {/* Who is for */}
                      {section === "who_is_for" && course.pages?.target_audience && (
                        <section className="py-10">
                          <h2 className={cn("text-2xl font-bold mb-4", style.headingClass)}>Who Is This For?</h2>
                          <p className="text-sm text-muted-foreground">{course.pages.target_audience}</p>
                        </section>
                      )}

                      {/* Course includes */}
                      {section === "course_includes" && (
                        <section className="py-10">
                          <h2 className={cn("text-2xl font-bold mb-6", style.headingClass)}>Course Includes</h2>
                          <div className="grid grid-cols-2 gap-3 text-sm text-foreground">
                            <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /> {course.modules.length} modules</div>
                            <div className="flex items-center gap-2"><Play className="h-4 w-4 text-muted-foreground" /> {totalLessons} lessons</div>
                            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {course.duration_weeks} weeks</div>
                            <div className="flex items-center gap-2"><Award className="h-4 w-4 text-muted-foreground" /> Certificate</div>
                          </div>
                        </section>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ════════ CURRICULUM ════════ */}
          {activeTab === "curriculum" && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{course.duration_weeks} weeks</Badge>
                <Badge variant="secondary"><BookOpen className="h-3 w-3 mr-1" />{totalLessons} lessons</Badge>
              </div>

              {style.moduleLayout === "timeline" && (
                <div className="relative pl-6 space-y-6">
                  <div className="absolute left-2.5 top-0 bottom-0 w-px" style={{ backgroundColor: `${style.primaryHex}40` }} />
                  {course.modules.map((mod, mIdx) => (
                    <div key={mod.id} className="relative">
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: style.primaryHex }}>
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
              )}

              {style.moduleLayout === "accordion" && (
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
              )}

              {style.moduleLayout === "numbered" && (
                <div className="space-y-4">
                  {course.modules.map((mod, mIdx) => (
                    <Card key={mod.id} className={style.cardClass}>
                      <CardContent className="pt-4">
                        <div className="flex items-baseline gap-3 mb-2">
                          <span className={cn("text-2xl font-bold", style.headingFont)} style={{ color: style.primaryHex }}>
                            {formatSectionNumber(mIdx)}
                          </span>
                          <h3 className={cn("font-semibold text-foreground", style.headingFont)}>{mod.title}</h3>
                        </div>
                        <ul className="space-y-1 pl-10">
                          {mod.lessons.map((l, lIdx) => (
                            <li key={l.id} className="text-sm text-muted-foreground">
                              <span className="font-mono text-xs mr-2">{formatSectionNumber(mIdx, lIdx)}</span>
                              {l.title}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {style.moduleLayout === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.modules.map((mod) => (
                    <Card key={mod.id} className={cn(style.cardClass, style.cardRadius, "overflow-hidden")}>
                      <div className="h-2" style={{ background: `linear-gradient(90deg, ${style.primaryHex}, ${style.primaryHex}88)` }} />
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
              )}
            </div>
          )}

          {/* ════════ LESSON ════════ */}
          {activeTab === "lesson" && currentModule && currentLesson && (
            <div className="flex gap-4 min-h-[500px]">
              {/* Sidebar */}
              <div className="w-48 shrink-0 border-r border-border pr-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Modules</p>
                {course.modules.map((mod, mIdx) => (
                  <div key={mod.id} className="mb-2">
                    <button
                      onClick={() => { setSelectedModuleIdx(mIdx); setSelectedLessonIdx(0); }}
                      className={cn("text-xs font-medium w-full text-left py-1 transition-colors",
                        mIdx === selectedModuleIdx ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {mod.title}
                    </button>
                    {mIdx === selectedModuleIdx && (
                      <div className="ml-2 space-y-0.5 mt-0.5">
                        {mod.lessons.map((l, lIdx) => (
                          <button
                            key={l.id}
                            onClick={() => setSelectedLessonIdx(lIdx)}
                            className={cn("flex items-center gap-1.5 text-[11px] w-full text-left py-0.5 transition-colors",
                              lIdx === selectedLessonIdx ? "text-primary" : "text-muted-foreground hover:text-foreground"
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

              {/* Main */}
              <div className="flex-1 space-y-4">
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

                {/* Content area */}
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
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-foreground">Content</Label>
                      <Textarea value={editingLessonContent} onChange={(e) => setEditingLessonContent(e.target.value)} rows={8} className="text-xs" />
                    </div>

                    {currentLesson.type === "video" && (
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
                          placeholder="https://..."
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
                          min={50}
                          max={100}
                          step={5}
                        />
                        <p className="text-xs text-muted-foreground">
                          {currentLesson.quiz_questions?.length ?? 0} questions
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" className="text-xs" onClick={() => {
                        const updated = { ...course };
                        updated.modules[selectedModuleIdx].lessons[selectedLessonIdx].content_markdown = editingLessonContent;
                        onUpdate?.(updated);
                        setIsEditingLesson(false);
                      }}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setIsEditingLesson(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(currentLesson.type === "video" || currentLesson.type === "text_video") && (
                      <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center border border-border">
                        <Monitor className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}

                    <div className="text-sm text-foreground whitespace-pre-wrap">
                      {currentLesson.content_markdown || currentLesson.description || "No content yet."}
                    </div>

                    {isCreatorView && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                        setEditingLessonContent(currentLesson.content_markdown || currentLesson.description || "");
                        setIsEditingLesson(true);
                      }}>
                        Edit Content
                      </Button>
                    )}
                  </div>
                )}

                {/* Nav */}
                <Separator />
                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
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
                    className="text-xs"
                    onClick={() => markComplete(currentLesson.id)}
                  >
                    {completedLessons.has(currentLesson.id) ? <><Check className="h-3 w-3 mr-1" />Done</> : "Mark Complete"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    disabled={selectedModuleIdx === course.modules.length - 1 && selectedLessonIdx === currentModule.lessons.length - 1}
                    onClick={() => {
                      if (selectedLessonIdx < currentModule.lessons.length - 1) setSelectedLessonIdx(selectedLessonIdx + 1);
                      else if (selectedModuleIdx < course.modules.length - 1) {
                        setSelectedModuleIdx(selectedModuleIdx + 1);
                        setSelectedLessonIdx(0);
                      }
                    }}
                  >
                    Next <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ════════ DASHBOARD ════════ */}
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
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-6 text-center">
                    <Trophy className="h-10 w-10 text-primary mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-foreground">Course Complete!</h3>
                    <p className="text-sm text-muted-foreground">Congratulations! You've completed all lessons.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className={style.cardClass}>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground mb-1">Continue Learning</p>
                    <p className="text-sm font-medium text-foreground">{course.modules[0]?.lessons[0]?.title ?? "Start the course"}</p>
                    <Button size="sm" className="mt-2 text-xs" style={{ backgroundColor: style.primaryHex }}>
                      Continue <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-border/40"><CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{completedLessons.size}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent></Card>
                <Card className="border-border/40"><CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{totalLessons}</p>
                  <p className="text-xs text-muted-foreground">Total Lessons</p>
                </CardContent></Card>
                <Card className="border-border/40"><CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{course.modules.length}</p>
                  <p className="text-xs text-muted-foreground">Modules</p>
                </CardContent></Card>
                <Card className="border-border/40"><CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{course.duration_weeks}</p>
                  <p className="text-xs text-muted-foreground">Est. Weeks</p>
                </CardContent></Card>
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

          {/* ════════ BONUSES ════════ */}
          {activeTab === "bonuses" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Bonuses</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(course.pages?.included_bonuses ?? ["Bonus workbook", "Community access", "1-on-1 coaching call"]).map((bonus, i) => (
                  <Card key={i} className={style.cardClass}>
                    <CardContent className="pt-4 flex items-center gap-3">
                      <Gift className="h-5 w-5 shrink-0" style={{ color: style.primaryHex }} />
                      <span className="text-sm text-foreground">{bonus}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ════════ RESOURCES ════════ */}
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

          {/* ════════ COMMUNITY ════════ */}
          {activeTab === "community" && (
            <div className="space-y-6 text-center py-10">
              <MessageCircle className="h-12 w-12 mx-auto text-primary" />
              <h2 className="text-xl font-bold text-foreground">Community</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Connect with fellow students, share your progress, and get help from the community.
              </p>
              <Card className={cn(style.cardClass, "max-w-sm mx-auto")}>
                <CardContent className="pt-6 space-y-3 text-left">
                  <div className="flex items-center gap-2 text-sm text-foreground"><Users className="h-4 w-4 text-muted-foreground" /> Discussion forums</div>
                  <div className="flex items-center gap-2 text-sm text-foreground"><MessageCircle className="h-4 w-4 text-muted-foreground" /> Live Q&A sessions</div>
                  <div className="flex items-center gap-2 text-sm text-foreground"><Star className="h-4 w-4 text-muted-foreground" /> Peer reviews</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════ TESTIMONIALS ════════ */}
          {activeTab === "testimonials" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">What Students Say</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["Amazing course!", "Best investment I've made.", "Transformed my skills."].map((text, i) => (
                  <Card key={i} className={style.cardClass}>
                    <CardContent className="pt-5">
                      <div className="flex gap-0.5 mb-2">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className="h-3.5 w-3.5 fill-primary text-primary" />
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
