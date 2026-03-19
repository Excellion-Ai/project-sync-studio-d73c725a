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
import { useHistory } from "@/hooks/useHistory";
import { useSubscription } from "@/hooks/useSubscription";
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

const ALLOWED_EMAILS = ["excellionai@gmail.com"];

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

const DEFAULT_DESIGN_CONFIG = {
  colors: {
    primary: "#d4a853",
    secondary: "#1a1a1a",
    accent: "#f59e0b",
    background: "#0a0a0a",
    cardBackground: "#111111",
    text: "#ffffff",
    textMuted: "#9ca3af",
  },
  fonts: { heading: "Inter", body: "Inter" },
  spacing: "normal" as const,
  borderRadius: "medium" as const,
  heroStyle: "gradient",
};

// ── Map AI response → ExtendedCourse ────────────────────────

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
      description: les.description || "",
      content_markdown: "",
      video_url: undefined,
      quiz_questions: undefined,
      passing_score: undefined,
      assignment_brief: undefined,
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
    pages: ai.pages || {
      landing_sections: ["hero", "outcomes", "curriculum", "instructor", "faq"],
    },
    design_config: ai.design_config || DEFAULT_DESIGN_CONFIG,
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
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const userEmail = user?.email ?? "";

  // ── Core state ────────────────────────────────────────────
  const [courseSpec, setCourseSpec] = useState<ExtendedCourse | null>(null);
  const {
    state: siteSpec,
    setState: setSiteSpec,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetSiteSpec,
  } = useHistory<Record<string, any> | null>(null);

  const [courseId, setCourseId] = useState<string | null>(initialCourseId || null);
  const [projectId, setProjectId] = useState<string | null>(initialProjectId || null);
  const [coursePublishedUrl, setCoursePublishedUrl] = useState<string | null>(null);

  // Generation
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

  // Preview & UI
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [courseSettings, setCourseSettings] = useState<CourseSettings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [isDirty, setIsDirty] = useState(false);

  // Dialogs
  const [showCourseSettings, setShowCourseSettings] = useState(false);
  const [showPublishSettings, setShowPublishSettings] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const projectName = courseSpec?.title ?? "Untitled Project";

  // Subscription
  const { subscribed } = useSubscription();
  const isFounder = ALLOWED_EMAILS.includes(userEmail);

  // ── Auto-trigger generation ───────────────────────────────

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

  // ── Warn before leaving with unsaved changes ──────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── Auto-save (1.5s debounce) ─────────────────────────────

  useEffect(() => {
    if (!isDirty || !userId) return;
    setSaveStatus("unsaved");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setSaveStatus("saving");

      // Sync builder_projects
      if (projectId) {
        await supabase
          .from("builder_projects")
          .update({
            name: projectName,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", projectId);
      }

      // Sync courses table
      if (courseSpec) {
        let id = courseId;
        if (!id && projectId) {
          id = await ensureCourseExists({
            projectId,
            userId,
            title: courseSpec.title,
            modules: courseSpec.modules,
          });
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
            meta: {
              difficulty: courseSpec.difficulty,
              duration_weeks: courseSpec.duration_weeks,
            },
          });
          setSaveStatus(ok ? "saved" : "unsaved");
        } else {
          setSaveStatus("unsaved");
        }
      } else {
        setSaveStatus("saved");
      }

      setIsDirty(false);
    }, 1500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [isDirty, courseSpec, siteSpec, courseId, projectId, userId, projectName]);

  // Mark dirty when specs change
  useEffect(() => {
    if (courseSpec || siteSpec) setIsDirty(true);
  }, [courseSpec, siteSpec]);

  // ── handleGenerateCourse ──────────────────────────────────

  const handleGenerateCourse = useCallback(
    async (options: CourseOptions) => {
      const ideaToUse = idea.trim();
      if (!ideaToUse || !userId) return;

      setIsGenerating(true);
      const genSteps = GENERATION_STEPS.map((s) => ({ ...s }));
      setSteps(genSteps);

      const updateStep = (
        id: string,
        status: GenerationStep["status"],
        label?: string
      ) => {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, status, ...(label ? { label } : {}) } : s
          )
        );
      };

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: ideaToUse },
      ]);

      try {
        // Step 1: Generate outline
        updateStep("analyze", "in_progress");

        const outlineResponse = (await AI.generateCourse(ideaToUse, {
          difficulty: options.difficulty,
          duration_weeks: options.duration_weeks,
          includeQuizzes: options.includeQuizzes,
          includeAssignments: options.includeAssignments,
          template: options.template,
        })) as Record<string, any>;

        updateStep("analyze", "complete");
        updateStep("structure", "in_progress");

        const course = mapAIResponseToCourse(outlineResponse, options);
        updateStep("structure", "complete");

        // Step 2: Save
        updateStep("save-outline", "in_progress");

        let bProjectId = projectId;
        if (!bProjectId) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            toast.error("Session expired. Please sign in again.");
            return;
          }
          const { data: proj, error: projError } = await supabase
            .from("builder_projects")
            .insert({ name: course.title, user_id: session.user.id })
            .select("id")
            .single();
          if (projError) {
            console.error("❌ builder_projects insert:", JSON.stringify(projError));
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
        } else {
          updateStep("save-outline", "error");
        }

        // Step 3: Atomically set courseSpec, clear siteSpec
        setCourseSpec(course);
        resetSiteSpec(null);

        updateStep("design", "in_progress");
        updateStep("design", "complete");
        updateStep("save", "in_progress");
        updateStep("save", "complete");

        const totalModules = course.modules.length;
        const totalLessons = course.modules.reduce(
          (c, m) => c + m.lessons.length,
          0
        );
        toast.success(
          `Course "${course.title}" created with ${totalModules} modules and ${totalLessons} lessons.`
        );

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Your course "${course.title}" is ready with ${totalModules} modules and ${totalLessons} lessons.\n\nAdd your own content:\n• Write or paste lesson text\n• Embed videos (YouTube, Vimeo)\n• Upload images and resources\n• Add quiz questions\n• Customize colors, fonts, and layout`,
          },
        ]);
      } catch (err: any) {
        console.error("❌ [generate] Error:", err);
        const failedStep = genSteps.find((s) => s.status === "in_progress");
        if (failedStep) updateStep(failedStep.id, "error");
        toast.error(`Generation failed: ${err?.message || "Unknown error"}`);
      } finally {
        setIsGenerating(false);
      }
    },
    [idea, userId, projectId, resetSiteSpec]
  );

  handleGenerateCourseRef.current = handleGenerateCourse;

  // ── handleGenerate (course-only) ──────────────────────────

  const handleGenerate = useCallback(
    (options: CourseOptions) => handleGenerateCourse(options),
    [handleGenerateCourse]
  );

  // ── Publish ───────────────────────────────────────────────

  const handlePublishCourse = useCallback(async () => {
    if (!courseId || !courseSpec) return;

    // Subscription gate (founders bypass)
    if (!subscribed && !isFounder) {
      toast.error("A paid plan is required to publish courses.");
      return;
    }

    setIsPublishing(true);
    try {
      const subdomain = `${courseSpec.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40)}-${Date.now().toString(36)}`;

      const publishedUrl = `${window.location.origin}/course/${subdomain}`;

      const { error } = await supabase
        .from("courses")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          subdomain,
          title: courseSpec.title,
          description: courseSpec.description,
          tagline: courseSpec.tagline,
          curriculum: courseSpec.modules as any,
          design_config: courseSpec.design_config as any,
          layout_template: courseSpec.layout_template ?? courseSpec.layout_style,
          section_order: (courseSpec.section_order ??
            courseSpec.pages?.landing_sections) as any,
          page_sections: courseSpec.pages as any,
          meta: {
            difficulty: courseSpec.difficulty,
            duration_weeks: courseSpec.duration_weeks,
          } as any,
        } as any)
        .eq("id", courseId);

      if (error) throw error;

      setIsPublished(true);
      setCoursePublishedUrl(publishedUrl);
      setShowPublishDialog(true);
      toast.success("Course published!");
    } catch (err: any) {
      console.error("Publish error:", err);
      toast.error(`Failed to publish: ${err?.message || "Unknown error"}`);
    } finally {
      setIsPublishing(false);
    }
  }, [courseId, courseSpec, subscribed, isFounder]);

  const handleUnpublish = useCallback(async () => {
    if (!courseId) return;
    try {
      await supabase
        .from("courses")
        .update({
          status: "draft",
          published_at: null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", courseId);
      setIsPublished(false);
      setCoursePublishedUrl(null);
      toast.success("Course unpublished.");
    } catch {
      toast.error("Failed to unpublish.");
    }
  }, [courseId]);

  // ── CourseCommandPanel: apply design changes ──────────────

  const handleApplyChanges = useCallback(
    (changes: Record<string, any>) => {
      if (!courseSpec) return;

      const updated = { ...courseSpec };

      // Deep-merge design_config
      if (changes.design_config) {
        updated.design_config = {
          ...updated.design_config,
          ...changes.design_config,
          colors: {
            ...updated.design_config?.colors,
            ...changes.design_config?.colors,
          },
          fonts: {
            ...updated.design_config?.fonts,
            ...changes.design_config?.fonts,
          },
          backgrounds: {
            ...updated.design_config?.backgrounds,
            ...changes.design_config?.backgrounds,
          },
        };
      }

      if (changes.layout_template) updated.layout_template = changes.layout_template;
      if (changes.section_order) updated.section_order = changes.section_order;

      // Deep-merge curriculum changes
      if (changes.curriculum && Array.isArray(changes.curriculum)) {
        updated.modules = changes.curriculum;
      }

      setCourseSpec(updated);

      // Persist to DB
      if (courseId) {
        updateCourseInDatabase(courseId, {
          design_config: updated.design_config,
          layout_template: updated.layout_template,
          section_order: updated.section_order,
          curriculum: updated.modules,
        });
      }
    },
    [courseSpec, courseId]
  );

  // ── Refine ────────────────────────────────────────────────

  const handleRefine = useCallback(
    async (prompt: string) => {
      if (!courseSpec) return;
      try {
        const result = (await AI.interpretCommand(
          prompt,
          courseSpec as any,
          courseSpec.design_config as any
        )) as Record<string, any>;
        if (result) handleApplyChanges(result);
      } catch (err: any) {
        toast.error(`Refine failed: ${err?.message}`);
      }
    },
    [courseSpec, handleApplyChanges]
  );

  // ── Updates ───────────────────────────────────────────────

  const handleCourseUpdate = useCallback(
    (updated: ExtendedCourse) => setCourseSpec(updated),
    []
  );

  const handleTitleUpdate = useCallback(
    (newTitle: string) => {
      if (courseSpec) setCourseSpec({ ...courseSpec, title: newTitle });
    },
    [courseSpec]
  );

  const handleSettingsUpdate = useCallback(
    (settings: CourseSettings) => {
      setCourseSettings(settings);
      if (courseSpec) {
        setCourseSpec({
          ...courseSpec,
          thumbnail: settings.thumbnail || courseSpec.thumbnail,
        });
      }
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
    },
    [courseSpec, courseId]
  );

  const courseUrl =
    coursePublishedUrl ||
    (courseSpec?.id ? `${window.location.origin}/course/${courseSpec.id}` : "");

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
        isUnpublishing={false}
        onPublish={handlePublishCourse}
        onUnpublish={handleUnpublish}
        onRefine={() => {}}
        onOpenSettings={() => setShowCourseSettings(true)}
        onOpenPublishSettings={() => setShowPublishSettings(true)}
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left — Chat / Command Panel (25%) */}
          <ResizablePanel defaultSize={25} minSize={18} maxSize={40}>
            <BuilderChatPanel
              idea={idea}
              onIdeaChange={setIdea}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              steps={steps}
              messages={messages}
              attachments={attachments}
              onAddAttachment={(item) =>
                setAttachments((prev) => [...prev, item])
              }
              onRemoveAttachment={(id) =>
                setAttachments((prev) => prev.filter((a) => a.id !== id))
              }
              onRefinePrompt={handleRefine}
              hasCourse={!!courseSpec}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right — Preview (75%) */}
          <ResizablePanel defaultSize={75}>
            <BuilderPreviewArea
              courseSpec={courseSpec}
              previewMode={previewMode}
              isPublished={isPublished}
              isPublishing={isPublishing}
              onCourseUpdate={handleCourseUpdate}
              onPublish={handlePublishCourse}
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
