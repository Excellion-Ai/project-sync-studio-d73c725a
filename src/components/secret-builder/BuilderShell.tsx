import { useState, useEffect, useRef, useCallback } from "react";
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
import { ExtendedCourse } from "@/types/course-pages";
import {
  CourseOptions,
  GenerationStep,
  AttachmentItem,
} from "./CourseBuilderPanel";
import { AI } from "@/services/ai";
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

const OUTLINE_STEPS: GenerationStep[] = [
  { id: "structure", label: "Building course structure", status: "pending" },
];

const CONTENT_STEPS: GenerationStep[] = [
  { id: "structure", label: "Course structure approved", status: "complete" },
  { id: "content", label: "Generating lesson content", status: "pending" },
  { id: "quiz", label: "Creating quiz questions", status: "pending" },
  { id: "design", label: "Polishing titles & copy", status: "pending" },
  { id: "save", label: "Saving to database", status: "pending" },
];

const FULL_GENERATION_STEPS: GenerationStep[] = [
  { id: "structure", label: "Building course structure", status: "pending" },
  { id: "content", label: "Generating lesson content", status: "pending" },
  { id: "quiz", label: "Creating quiz questions", status: "pending" },
  { id: "design", label: "Polishing titles & copy", status: "pending" },
  { id: "save", label: "Saving to database", status: "pending" },
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
  const [courseSpec, setCourseSpec] = useState<ExtendedCourse | null>(null);
  const [courseId, setCourseId] = useState<string | null>(initialCourseId || null);
  const [projectId, setProjectId] = useState<string | null>(initialProjectId || null);
  const [userId, setUserId] = useState<string | null>(null);

  // Generation — read from prop, then localStorage fallback
  const resolvedIdea = initialIdea || localStorage.getItem("builder-initial-idea") || "";
  const [idea, setIdea] = useState(resolvedIdea);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  // Outline-first approval flow
  const [pendingOutline, setPendingOutline] = useState<ExtendedCourse | null>(null);
  const [pendingOptions, setPendingOptions] = useState<CourseOptions | null>(null);

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

  // ── Auth ───────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // ── Auto-trigger generation from hub ──────────────────────
  const handleGenerateCourseRef = useRef<((options: CourseOptions) => Promise<void>) | null>(null);

  useEffect(() => {
    if (hasAutoTriggered || !resolvedIdea || !userId || isGenerating) return;
    if (!handleGenerateCourseRef.current) return;
    setHasAutoTriggered(true);
    localStorage.removeItem("builder-initial-idea");
    handleGenerateCourseRef.current({
      difficulty: "beginner",
      depth: "standard",
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

  // ── Generate (Phase 1: Outline Only) ───────────────────────

  const handleGenerateCourse = useCallback(async (options: CourseOptions) => {
    if (!idea.trim() || !userId) return;
    setIsGenerating(true);
    setPendingOutline(null);
    setPendingOptions(options);
    setSteps(OUTLINE_STEPS.map((s) => ({ ...s })));

    const updateStep = (id: string, status: GenerationStep["status"]) => {
      setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    };

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: idea }]);

    try {
      let outline: ExtendedCourse | null = null;

      for await (const event of AI.generateCourseStream(idea, {
        difficulty: options.difficulty,
        depth: options.depth,
        duration_weeks: options.duration_weeks,
        includeQuizzes: options.includeQuizzes,
        includeAssignments: options.includeAssignments,
        template: options.template,
        audience: options.audience,
        niche: options.niche,
        outlineOnly: true,
      })) {
        switch (event.type) {
          case "step":
            if (event.data.status === "error") {
              updateStep(event.data.step, "error");
            } else {
              updateStep(event.data.step, event.data.status === "complete" ? "complete" : "in_progress");
            }
            break;
          case "outline":
            setCourseSpec({ ...event.data, layout_style: options.template } as ExtendedCourse);
            break;
          case "outline_ready":
            // Phase 1 complete — show outline for approval
            outline = { ...event.data, layout_style: options.template } as ExtendedCourse;
            setCourseSpec(outline);
            setPendingOutline(outline);
            break;
          case "complete":
            // Full generation (fallback if outline_ready wasn't emitted)
            outline = { ...event.data, layout_style: options.template } as ExtendedCourse;
            setCourseSpec(outline);
            break;
          case "warning":
            console.warn("[generation warning]", event.data.message, event.data.details);
            break;
          case "metrics":
            console.log("[generation metrics]", event.data);
            break;
          case "error":
            throw new Error(event.data.message || "Course generation failed");
        }
      }

      if (!outline) throw new Error("No course data was returned. The AI may have timed out — try a simpler course topic or shorter duration.");

      if (pendingOutline || outline) {
        const totalLessons = outline.modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0);
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Course outline ready: "${outline!.title}" with ${outline!.modules.length} modules and ${totalLessons} lessons.\n\nReview the outline in the preview panel. You can edit module/lesson titles and structure. When you're happy with it, click **"Approve & Generate Content"** to create the full lesson content.`,
        }]);
        toast.success("Course outline ready for review!");
      }
    } catch (err) {
      console.error("Generation failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";

      setSteps((prev) => {
        const inProgress = prev.find((s) => s.status === "in_progress");
        if (inProgress) return prev.map((s) => s.id === inProgress.id ? { ...s, status: "error" as const } : s);
        return prev;
      });

      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `❌ **Generation failed:** ${errorMessage}\n\nYou can try again with a different course idea, simpler topic, or shorter duration.`,
      }]);

      toast.error(errorMessage.length > 100 ? errorMessage.slice(0, 100) + "…" : errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [idea, userId, projectId]);

  // ── Generate (Phase 2: Content from Approved Outline) ──────

  const handleApproveOutline = useCallback(async () => {
    if (!courseSpec || !userId || !pendingOptions) return;
    setIsGenerating(true);
    setPendingOutline(null);
    setSteps(CONTENT_STEPS.map((s) => ({ ...s })));

    const updateStep = (id: string, status: GenerationStep["status"]) => {
      setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    };

    setMessages((prev) => [...prev, {
      id: crypto.randomUUID(),
      role: "user",
      content: "Outline approved — generating full content...",
    }]);

    try {
      let course: ExtendedCourse | null = null;
      const generationWarnings: string[] = [];

      for await (const event of AI.generateFromOutlineStream(courseSpec, {
        difficulty: pendingOptions.difficulty,
        depth: pendingOptions.depth,
        duration_weeks: pendingOptions.duration_weeks,
        includeQuizzes: pendingOptions.includeQuizzes,
        includeAssignments: pendingOptions.includeAssignments,
        template: pendingOptions.template,
        audience: pendingOptions.audience,
        niche: pendingOptions.niche,
        approvedOutline: courseSpec,
      })) {
        switch (event.type) {
          case "step":
            if (event.data.status === "error") {
              updateStep(event.data.step, "error");
            } else {
              updateStep(event.data.step, event.data.status === "complete" ? "complete" : "in_progress");
            }
            break;
          case "outline":
            // Already have outline, just update
            setCourseSpec({ ...event.data, layout_style: pendingOptions.template } as ExtendedCourse);
            break;
          case "complete":
            course = { ...event.data, layout_style: pendingOptions.template } as ExtendedCourse;
            setCourseSpec(course);
            break;
          case "warning":
            generationWarnings.push(event.data.message);
            console.warn("[generation warning]", event.data.message, event.data.details);
            break;
          case "metrics":
            console.log("[generation metrics]", event.data);
            break;
          case "error":
            throw new Error(event.data.message || "Content generation failed");
        }
      }

      if (!course) throw new Error("No course data was returned. The AI may have timed out — try a simpler course or shorter duration.");

      // Save to database
      updateStep("save", "in_progress");
      let bProjectId = projectId;
      if (!bProjectId) {
        const { data: proj, error: projError } = await supabase
          .from("builder_projects")
          .insert({ name: course.title, user_id: userId })
          .select("id")
          .single();
        if (projError) console.error("builder_projects insert error:", projError);
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
        offerType: pendingOptions.template,
      });

      if (saved) { course.id = saved.id; setCourseId(saved.id); }
      updateStep("save", "complete");
      setCourseSpec(course);

      const totalLessons = course.modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0);
      let assistantMsg = `Your course "${course.title}" has been generated with ${course.modules.length} modules and ${totalLessons} lessons. You can now preview, edit, and refine it.`;
      if (generationWarnings.length > 0) {
        assistantMsg += `\n\n⚠️ **Heads up:** ${generationWarnings.join(" ")} You can fix these by using the Refine tab to regenerate specific sections.`;
      }

      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantMsg,
      }]);

      if (generationWarnings.length > 0) {
        toast.success("Course generated with some sections using placeholder content. Use Refine to improve them.");
      } else {
        toast.success("Course generated successfully!");
      }
    } catch (err) {
      console.error("Content generation failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";

      setSteps((prev) => {
        const inProgress = prev.find((s) => s.status === "in_progress");
        if (inProgress) return prev.map((s) => s.id === inProgress.id ? { ...s, status: "error" as const } : s);
        return prev;
      });

      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `❌ **Content generation failed:** ${errorMessage}\n\nYou can try again — your outline is still saved.`,
      }]);

      // Restore the pending outline so user can try again
      setPendingOutline(courseSpec);
      toast.error(errorMessage.length > 100 ? errorMessage.slice(0, 100) + "…" : errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [courseSpec, userId, projectId, pendingOptions]);

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
              pendingOutline={pendingOutline}
              onApproveOutline={handleApproveOutline}
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
