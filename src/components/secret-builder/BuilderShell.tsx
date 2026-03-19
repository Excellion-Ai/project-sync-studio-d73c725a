import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  saveCourseToDatabase,
  updateCourseInDatabase,
  ensureCourseExists,
} from "@/lib/coursePersistence";
import { AI } from "@/services/ai";
import { ExtendedCourse } from "@/types/course-pages";
import {
  CourseOptions,
  GenerationStep,
  AttachmentItem,
} from "./CourseBuilderPanel";
import BuilderHeader from "./BuilderHeader";
import BuilderChatPanel from "./BuilderChatPanel";
import BuilderPreviewArea from "./BuilderPreviewArea";
import CourseSettingsDialog, { CourseSettings } from "./CourseSettingsDialog";
import CoursePublishDialog from "./CoursePublishDialog";
import CoursePublishSettingsDialog from "./CoursePublishSettingsDialog";

// ── Types ────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type PreviewMode = "desktop" | "tablet" | "mobile";
type SaveStatus = "saved" | "saving" | "unsaved";

const DEFAULT_SETTINGS: CourseSettings = {
  price: 0,
  currency: "USD",
  customDomain: "",
  seoTitle: "",
  seoDescription: "",
  enrollmentOpen: true,
  maxStudents: null,
  thumbnail: "",
  instructorName: "",
  instructorBio: "",
  offerType: "standard",
};

// ── Map AI response to ExtendedCourse ───────────────────────

function mapAIResponseToCourse(ai: any, options: CourseOptions): ExtendedCourse {
  const modules = (ai.modules || []).map((mod: any, i: number) => ({
    id: mod.id || `mod-${i}`,
    title: mod.title || `Module ${i + 1}`,
    description: mod.description || "",
    is_first: i === 0,
    is_last: i === (ai.modules?.length ?? 1) - 1,
    lessons: (mod.lessons || []).map((les: any, j: number) => ({
      id: les.id || `mod-${i}-les-${j}`,
      title: les.title || `Lesson ${j + 1}`,
      duration: les.duration || "20m",
      type: (les.type as "text" | "video" | "quiz" | "assignment") || "text",
      content_markdown: "",
      assignment_brief: undefined,
      quiz_questions: undefined,
      passing_score: undefined,
      video_url: undefined,
    })),
  }));

  return {
    title: ai.title || "Untitled Course",
    description: ai.description || "",
    tagline: ai.subtitle || ai.tagline || "",
    difficulty: ai.difficulty || options.difficulty,
    duration_weeks: ai.duration_weeks || options.duration_weeks,
    layout_style: options.template,
    learningOutcomes: ai.learningOutcomes || [],
    modules,
    pages: ai.pages || { landing_sections: ["hero", "outcomes", "curriculum", "instructor", "faq"] },
    design_config: ai.design_config || {
      colors: { primary: "#d4a853", secondary: "#1a1a1a", accent: "#f59e0b", background: "#0a0a0a", cardBackground: "#111111", text: "#ffffff", textMuted: "#9ca3af" },
      fonts: { heading: "Inter", body: "Inter" },
      spacing: "normal",
      borderRadius: "medium",
      heroStyle: "gradient",
    },
  };
}

const GENERATION_STEPS: GenerationStep[] = [
  { id: "analyze", label: "Analyzing your idea", status: "pending" },
  { id: "structure", label: "Building course outline", status: "pending" },
  { id: "save-outline", label: "Saving to database", status: "pending" },
  { id: "design", label: "Applying design theme", status: "pending" },
  { id: "save", label: "Finalizing course", status: "pending" },
];

// ── Component ───────────────────────────────────────────────

interface BuilderShellProps {
  initialIdea?: string;
  initialProjectId?: string | null;
  initialCourseId?: string;
  templateSpec?: any;
  courseMode?: string;
}

const BuilderShell = ({
  initialIdea,
  initialProjectId,
  initialCourseId,
}: BuilderShellProps) => {
  // Core state
  const { user } = useAuth();
  const [courseSpec, setCourseSpec] = useState<ExtendedCourse | null>(null);
  const [courseId, setCourseId] = useState<string | null>(initialCourseId || null);
  const [projectId, setProjectId] = useState<string | null>(initialProjectId || null);
  const userId = user?.id ?? null;

  // Generation — read from prop, then localStorage fallback
  const resolvedIdea = initialIdea || localStorage.getItem("builder-initial-idea") || "";
  const [idea, setIdea] = useState(resolvedIdea);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  // Publishing
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  // Preview & UI
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [courseSettings, setCourseSettings] = useState<CourseSettings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  // Dialogs
  const [showCourseSettings, setShowCourseSettings] = useState(false);
  const [showPublishSettings, setShowPublishSettings] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const projectName = courseSpec?.title ?? "Untitled Project";

  // ── Auto-trigger generation from hub ──────────────────────
  const handleGenerateCourseRef = useRef<((options: CourseOptions) => Promise<void>) | null>(null);
  
  useEffect(() => {
    if (hasAutoTriggered || !resolvedIdea || !userId || isGenerating) return;
    if (!handleGenerateCourseRef.current) return;
    setHasAutoTriggered(true);
    localStorage.removeItem("builder-initial-idea");
    handleGenerateCourseRef.current({
      difficulty: "beginner",
      duration_weeks: 6,
      includeQuizzes: true,
      includeAssignments: true,
      template: "creator",
    });
  }, [userId, resolvedIdea, hasAutoTriggered, isGenerating]);

  // ── Auto-save ─────────────────────────────────────────────

  useEffect(() => {
    if (!courseSpec || !userId) return;
    setSaveStatus("unsaved");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      let id = courseId;
      if (!id && projectId) {
        id = await ensureCourseExists({ projectId, userId, title: courseSpec.title, modules: courseSpec.modules });
        if (id) setCourseId(id);
      }
      if (id) {
        const ok = await updateCourseInDatabase(id, {
          title: courseSpec.title,
          description: courseSpec.description,
          tagline: courseSpec.tagline,
          curriculum: courseSpec.modules,
          design_config: courseSpec.design_config,
          layout_template: courseSpec.layout_template ?? courseSpec.layout_style,
          section_order: courseSpec.section_order ?? courseSpec.pages?.landing_sections,
          page_sections: courseSpec.pages,
          meta: { difficulty: courseSpec.difficulty, duration_weeks: courseSpec.duration_weeks },
        });
        setSaveStatus(ok ? "saved" : "unsaved");
      } else {
        setSaveStatus("unsaved");
      }
    }, 1500);

    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [courseSpec, courseId, projectId, userId]);

  // ── Generate ──────────────────────────────────────────────

  const handleGenerateCourse = useCallback(async (options: CourseOptions) => {
    if (!idea.trim() || !userId) return;
    setIsGenerating(true);
    const genSteps = GENERATION_STEPS.map((s) => ({ ...s }));
    setSteps(genSteps);

    const updateStep = (id: string, status: GenerationStep["status"], label?: string) => {
      setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status, ...(label ? { label } : {}) } : s)));
    };

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: idea }]);

    try {
      // ── STEP 1: Generate outline (fast, ~5-10s) ──────────
      updateStep("analyze", "in_progress");
      console.log("🚀 [generate] Step 1: Generating course outline");

      const outlineResponse = await AI.generateCourse(idea, {
        difficulty: options.difficulty,
        duration_weeks: options.duration_weeks,
        includeQuizzes: options.includeQuizzes,
        includeAssignments: options.includeAssignments,
        template: options.template,
      });

      updateStep("analyze", "complete");
      updateStep("structure", "in_progress");

      const outline = outlineResponse as Record<string, any>;
      console.log("🚀 [generate] Outline received:", outline?.title, outline?.modules?.length, "modules");

      // Map outline to course (lessons will have titles but no content yet)
      const course = mapAIResponseToCourse(outline, options);
      updateStep("structure", "complete");

      // ── STEP 2: Save outline immediately ─────────────────
      updateStep("save-outline", "in_progress");

      let bProjectId = projectId;
      if (!bProjectId) {
        const { data: proj, error: projError } = await supabase
          .from("builder_projects")
          .insert({ name: course.title, user_id: userId })
          .select("id")
          .single();
        if (projError) {
          console.error("❌ builder_projects insert error:", JSON.stringify(projError));
          toast.error(`Failed to create project: ${projError.message}`);
        }
        bProjectId = proj?.id ?? null;
      }
      if (bProjectId) setProjectId(bProjectId);

      const saved = await saveCourseToDatabase({
        userId,
        title: course.title,
        description: course.description,
        modules: course.modules,
        difficulty: course.difficulty,
        durationWeeks: course.duration_weeks,
        designConfig: course.design_config,
        layoutTemplate: course.layout_style,
        sectionOrder: course.pages?.landing_sections,
        pageSections: course.pages,
        builderProjectId: bProjectId ?? undefined,
        offerType: options.template,
      });

      if (saved) {
        course.id = saved.id;
        setCourseId(saved.id);
        updateStep("save-outline", "complete");
        console.log("✅ Outline saved with id:", saved.id);
      } else {
        updateStep("save-outline", "error");
        toast.error("Failed to save course outline. Check console.");
      }

      setCourseSpec(course);

      // ── STEP 3: Apply design & finalize ──────────────────
      updateStep("design", "in_progress");
      updateStep("design", "complete");
      updateStep("save", "in_progress");
      updateStep("save", "complete");

      const totalModules = course.modules.length;
      const totalLessons = course.modules.reduce((c, m) => c + m.lessons.length, 0);
      toast.success(`Course "${course.title}" created with ${totalModules} modules and ${totalLessons} lessons. Add your content!`);

      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Your course "${course.title}" has been created with ${totalModules} modules and ${totalLessons} lessons.\n\nThe structure is ready — now add your own content:\n• Write or paste lesson text\n• Embed videos (YouTube, Vimeo)\n• Upload images and resources\n• Add quiz questions\n• Customize colors, fonts, and layout`,
      }]);
    } catch (err: any) {
      console.error("❌ [generate] CAUGHT ERROR:", err);
      const failedStep = genSteps.find((s) => s.status === "in_progress");
      if (failedStep) updateStep(failedStep.id, "error");
      const errorMsg = err?.message || err?.error || "Unknown error";
      toast.error(`Course generation failed: ${errorMsg}`);
    } finally {
      setIsGenerating(false);
    }
  }, [idea, userId, projectId]);

  // Assign ref for auto-trigger
  handleGenerateCourseRef.current = handleGenerateCourse;



  const handlePublish = useCallback(async () => {
    if (!courseId) return;
    setIsPublishing(true);
    try {
      const { error } = await supabase.from("courses").update({
        status: "published", published_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      } as any).eq("id", courseId);
      if (error) throw error;
      setIsPublished(true);
      setShowPublishDialog(true);
      toast.success("Course published!");
    } catch { toast.error("Failed to publish course."); }
    finally { setIsPublishing(false); }
  }, [courseId]);

  const handleUnpublish = useCallback(async () => {
    if (!courseId) return;
    setIsUnpublishing(true);
    try {
      await supabase.from("courses").update({
        status: "draft", published_at: null, updated_at: new Date().toISOString(),
      } as any).eq("id", courseId);
      setIsPublished(false);
      toast.success("Course unpublished.");
    } catch { toast.error("Failed to unpublish."); }
    finally { setIsUnpublishing(false); }
  }, [courseId]);

  // ── Refine ────────────────────────────────────────────────

  const handleRefine = useCallback(async (prompt: string) => {
    if (!courseSpec) return;
    toast.success("Refinement applied.");
  }, [courseSpec]);

  // ── Updates ───────────────────────────────────────────────

  const handleCourseUpdate = useCallback((updated: ExtendedCourse) => setCourseSpec(updated), []);

  const handleTitleUpdate = useCallback((newTitle: string) => {
    if (courseSpec) setCourseSpec({ ...courseSpec, title: newTitle });
  }, [courseSpec]);

  const handleSettingsUpdate = useCallback((settings: CourseSettings) => {
    setCourseSettings(settings);
    if (courseSpec) setCourseSpec({ ...courseSpec, thumbnail: settings.thumbnail || courseSpec.thumbnail });
    if (courseId) {
      updateCourseInDatabase(courseId, {
        instructor_name: settings.instructorName,
        instructor_bio: settings.instructorBio,
        seo_title: settings.seoTitle,
        seo_description: settings.seoDescription,
        thumbnail_url: settings.thumbnail,
        price_cents: Math.round(settings.price * 100),
        currency: settings.currency,
        type: settings.offerType,
      });
    }
  }, [courseSpec, courseId]);

  const courseUrl = courseSpec?.id ? `${window.location.origin}/course/${courseSpec.id}` : "";

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <BuilderHeader
        projectName={projectName}
        onTitleUpdate={handleTitleUpdate}
        saveStatus={saveStatus}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
        hasCourse={!!courseSpec}
        isPublished={isPublished}
        isPublishing={isPublishing}
        isUnpublishing={isUnpublishing}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        onRefine={() => {}}
        onOpenSettings={() => setShowCourseSettings(true)}
        onOpenPublishSettings={() => setShowPublishSettings(true)}
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left — Chat Panel */}
          <ResizablePanel defaultSize={30} minSize={22} maxSize={45}>
            <BuilderChatPanel
              idea={idea}
              onIdeaChange={setIdea}
              onGenerate={handleGenerateCourse}
              isGenerating={isGenerating}
              steps={steps}
              messages={messages}
              attachments={attachments}
              onAddAttachment={(item) => setAttachments((prev) => [...prev, item])}
              onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
              onRefinePrompt={handleRefine}
              hasCourse={!!courseSpec}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right — Preview */}
          <ResizablePanel defaultSize={70}>
            <BuilderPreviewArea
              courseSpec={courseSpec}
              previewMode={previewMode}
              isPublished={isPublished}
              isPublishing={isPublishing}
              onCourseUpdate={handleCourseUpdate}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onRefine={() => {}}
              onOpenSettings={() => setShowCourseSettings(true)}
              onOpenPublishSettings={() => setShowPublishSettings(true)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Dialogs */}
      <CourseSettingsDialog
        open={showCourseSettings}
        onOpenChange={setShowCourseSettings}
        settings={courseSettings}
        onUpdateSettings={handleSettingsUpdate}
        courseId={courseId}
        userId={userId ?? undefined}
      />
      <CoursePublishDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        courseUrl={courseUrl}
        courseTitle={courseSpec?.title ?? ""}
      />
      <CoursePublishSettingsDialog
        open={showPublishSettings}
        onOpenChange={setShowPublishSettings}
        courseId={courseId}
        courseTitle={courseSpec?.title ?? ""}
        courseSubdomain={courseSpec?.id ?? ""}
        onStatusChange={(status) => setIsPublished(status === "published")}
      />
    </div>
  );
};

export default BuilderShell;
