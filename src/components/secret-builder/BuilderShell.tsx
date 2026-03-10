import { useState, useEffect, useRef, useCallback } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  Settings,
  Loader2,
  Save,
  Cloud,
  CloudOff,
  Wand2,
  MoreVertical,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  saveCourseToDatabase,
  updateCourseInDatabase,
  ensureCourseExists,
} from "@/lib/coursePersistence";
import { ExtendedCourse } from "@/types/course-pages";
import CourseBuilderPanel, {
  CourseOptions,
  GenerationStep,
  AttachmentItem,
} from "./CourseBuilderPanel";
import CoursePreviewTabs from "./CoursePreviewTabs";
import RefineChat from "./RefineChat";
import CourseSettingsDialog, { CourseSettings } from "./CourseSettingsDialog";
import CoursePublishDialog from "./CoursePublishDialog";
import CoursePublishSettingsDialog from "./CoursePublishSettingsDialog";
import EditableText from "./EditableText";

// ── Types ────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type PreviewMode = "desktop" | "tablet" | "mobile";
type SaveStatus = "saved" | "saving" | "unsaved";

// ── Default course settings ─────────────────────────────────

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

// ── Helper: build a mock ExtendedCourse from an idea ────────

function buildMockCourse(idea: string, options: CourseOptions): ExtendedCourse {
  const title = idea.length > 60 ? idea.slice(0, 57) + "…" : idea;
  return {
    title,
    description: idea,
    tagline: `Master ${title} step-by-step`,
    difficulty: options.difficulty,
    duration_weeks: options.duration_weeks,
    layout_style: options.template,
    learningOutcomes: [
      "Understand core concepts",
      "Apply knowledge practically",
      "Build a real project",
    ],
    modules: Array.from({ length: Math.ceil(options.duration_weeks / 2) }, (_, i) => ({
      id: `mod-${i}`,
      title: `Module ${i + 1}`,
      description: `Week ${i * 2 + 1}–${i * 2 + 2} content`,
      is_first: i === 0,
      is_last: i === Math.ceil(options.duration_weeks / 2) - 1,
      lessons: [
        {
          id: `mod-${i}-les-0`,
          title: "Introduction",
          duration: "15m",
          type: "text" as const,
          content_markdown: "Lesson content goes here.",
        },
        {
          id: `mod-${i}-les-1`,
          title: "Deep Dive",
          duration: "25m",
          type: "video" as const,
          video_url: "",
        },
        ...(options.includeQuizzes
          ? [
              {
                id: `mod-${i}-les-2`,
                title: "Knowledge Check",
                duration: "10m",
                type: "quiz" as const,
                quiz_questions: [],
                passing_score: 70,
              },
            ]
          : []),
        ...(options.includeAssignments
          ? [
              {
                id: `mod-${i}-les-3`,
                title: "Assignment",
                duration: "30m",
                type: "assignment" as const,
                assignment_brief: "Complete the practical exercise.",
              },
            ]
          : []),
      ],
    })),
    pages: {
      landing_sections: ["hero", "outcomes", "curriculum", "instructor", "faq"],
    },
    design_config: {
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
      spacing: "normal",
      borderRadius: "medium",
      heroStyle: "gradient",
    },
  };
}

// ── Generation step definitions ─────────────────────────────

const GENERATION_STEPS: GenerationStep[] = [
  { id: "analyze", label: "Analyzing your idea", status: "pending" },
  { id: "structure", label: "Building course structure", status: "pending" },
  { id: "content", label: "Generating lesson content", status: "pending" },
  { id: "design", label: "Applying design theme", status: "pending" },
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
  templateSpec,
  courseMode,
}: BuilderShellProps) => {
  // Core state
  const [courseSpec, setCourseSpec] = useState<ExtendedCourse | null>(null);
  const [courseId, setCourseId] = useState<string | null>(initialCourseId || null);
  const [projectId, setProjectId] = useState<string | null>(initialProjectId || null);
  const [userId, setUserId] = useState<string | null>(null);

  // Generation
  const [idea, setIdea] = useState(initialIdea || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  // Publishing
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  // Preview
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");

  // Settings
  const [courseSettings, setCourseSettings] = useState<CourseSettings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  // Dialogs
  const [showRefineChat, setShowRefineChat] = useState(false);
  const [showCourseSettings, setShowCourseSettings] = useState(false);
  const [showPublishSettings, setShowPublishSettings] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // Refs
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const projectName = courseSpec?.title ?? "Untitled Project";

  // ── Auth ───────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // ── Auto-save debounce ─────────────────────────────────────

  useEffect(() => {
    if (!courseSpec || !userId) return;

    setSaveStatus("unsaved");

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setSaveStatus("saving");

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
    }, 1500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [courseSpec, courseId, projectId, userId]);

  // ── Generate course ────────────────────────────────────────

  const handleGenerateCourse = useCallback(
    async (options: CourseOptions) => {
      if (!idea.trim() || !userId) return;

      setIsGenerating(true);
      const genSteps = GENERATION_STEPS.map((s) => ({ ...s }));
      setSteps(genSteps);

      const updateStep = (id: string, status: GenerationStep["status"]) => {
        setSteps((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status } : s))
        );
      };

      // Add user message
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: idea,
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        // Step 1 — analyze
        updateStep("analyze", "in_progress");
        await new Promise((r) => setTimeout(r, 600));
        updateStep("analyze", "complete");

        // Step 2 — structure
        updateStep("structure", "in_progress");
        await new Promise((r) => setTimeout(r, 800));
        updateStep("structure", "complete");

        // Step 3 — content
        updateStep("content", "in_progress");
        await new Promise((r) => setTimeout(r, 1000));
        const course = buildMockCourse(idea, options);
        updateStep("content", "complete");

        // Step 4 — design
        updateStep("design", "in_progress");
        await new Promise((r) => setTimeout(r, 500));
        updateStep("design", "complete");

        // Step 5 — save
        updateStep("save", "in_progress");

        // Create builder project
        const { data: proj } = await supabase
          .from("builder_projects")
          .insert({ name: course.title, user_id: userId })
          .select("id")
          .single();

        const bProjectId = proj?.id ?? null;
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
        }

        updateStep("save", "complete");

        setCourseSpec(course);

        // Assistant message
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Your course "${course.title}" has been generated with ${course.modules.length} modules. You can now preview, edit, and refine it.`,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        toast.success("Course generated successfully!");
      } catch (err) {
        console.error("Generation failed:", err);
        const failedStep = genSteps.find((s) => s.status === "in_progress");
        if (failedStep) updateStep(failedStep.id, "error");
        toast.error("Failed to generate course. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [idea, userId]
  );

  // ── Publish ────────────────────────────────────────────────

  const handlePublish = useCallback(async () => {
    if (!courseId) return;
    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from("courses")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", courseId);

      if (error) throw error;

      setIsPublished(true);
      setShowPublishDialog(true);
      toast.success("Course published!");
    } catch (err) {
      console.error("Publish failed:", err);
      toast.error("Failed to publish course.");
    } finally {
      setIsPublishing(false);
    }
  }, [courseId]);

  const handleUnpublish = useCallback(async () => {
    if (!courseId) return;
    setIsUnpublishing(true);
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
      toast.success("Course unpublished.");
    } catch {
      toast.error("Failed to unpublish.");
    } finally {
      setIsUnpublishing(false);
    }
  }, [courseId]);

  // ── Refine ─────────────────────────────────────────────────

  const handleRefine = useCallback(
    async (prompt: string) => {
      if (!courseSpec) return;
      // Mock refinement — just acknowledge
      toast.success("Refinement applied (mock).");
    },
    [courseSpec]
  );

  // ── Course update from preview ─────────────────────────────

  const handleCourseUpdate = useCallback((updated: ExtendedCourse) => {
    setCourseSpec(updated);
  }, []);

  // ── Settings update ────────────────────────────────────────

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

  // ── Title update ───────────────────────────────────────────

  const handleTitleUpdate = useCallback(
    (newTitle: string) => {
      if (courseSpec) {
        setCourseSpec({ ...courseSpec, title: newTitle });
      }
    },
    [courseSpec]
  );

  // ── Attachments ────────────────────────────────────────────

  const handleAddAttachment = useCallback((item: AttachmentItem) => {
    setAttachments((prev) => [...prev, item]);
  }, []);

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ── Preview mode widths ────────────────────────────────────

  const previewClass =
    previewMode === "tablet"
      ? "max-w-[768px]"
      : previewMode === "mobile"
        ? "max-w-[390px]"
        : "";

  const courseUrl = courseSpec?.id
    ? `${window.location.origin}/course/${courseSpec.id}`
    : "";

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* ── Header Bar ───────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <EditableText
            value={projectName}
            onSave={handleTitleUpdate}
            className="text-sm font-semibold"
          />
          <Badge
            variant="outline"
            className={cn(
              "text-xs capitalize",
              saveStatus === "saved" && "text-emerald-500 border-emerald-500/30",
              saveStatus === "saving" && "text-amber-500 border-amber-500/30",
              saveStatus === "unsaved" && "text-muted-foreground"
            )}
          >
            {saveStatus === "saving" ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : saveStatus === "saved" ? (
              <Cloud className="mr-1 h-3 w-3" />
            ) : (
              <CloudOff className="mr-1 h-3 w-3" />
            )}
            {saveStatus}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {/* Preview mode toggle */}
          <div className="flex items-center rounded-md border border-border p-0.5">
            {(
              [
                { mode: "desktop" as const, icon: Monitor },
                { mode: "tablet" as const, icon: Tablet },
                { mode: "mobile" as const, icon: Smartphone },
              ] as const
            ).map(({ mode, icon: Icon }) => (
              <Button
                key={mode}
                size="icon"
                variant={previewMode === mode ? "secondary" : "ghost"}
                className="h-7 w-7"
                onClick={() => setPreviewMode(mode)}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>

          {/* Refine button */}
          {courseSpec && (
            <Button
              size="sm"
              variant="outline"
              className="ml-2"
              onClick={() => setShowRefineChat(true)}
            >
              <Wand2 className="mr-1 h-3.5 w-3.5" />
              Refine
            </Button>
          )}

          {/* Publish */}
          {courseSpec && (
            <Button
              size="sm"
              className="ml-2"
              disabled={isPublishing || !courseId}
              onClick={isPublished ? handleUnpublish : handlePublish}
            >
              {isPublishing || isUnpublishing ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Rocket className="mr-1 h-3.5 w-3.5" />
              )}
              {isPublished ? "Unpublish" : "Publish"}
            </Button>
          )}

          {/* Settings dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 ml-1">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowCourseSettings(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Course Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPublishSettings(true)}>
                <Rocket className="mr-2 h-4 w-4" />
                Publish Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => toast.info("Duplicate feature coming soon.")}
              >
                Duplicate Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Main Panels ──────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left — Builder Panel */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
            <CourseBuilderPanel
              idea={idea}
              onIdeaChange={setIdea}
              onGenerate={handleGenerateCourse}
              isGenerating={isGenerating}
              steps={steps}
              messages={messages}
              attachments={attachments}
              onAddAttachment={handleAddAttachment}
              onRemoveAttachment={handleRemoveAttachment}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center — Preview */}
          <ResizablePanel defaultSize={showRefineChat ? 45 : 70}>
            <div className="h-full overflow-auto bg-muted/30">
              {courseSpec ? (
                <div className={cn("mx-auto h-full transition-all", previewClass)}>
                  <CoursePreviewTabs
                    course={courseSpec}
                    onUpdate={handleCourseUpdate}
                    onPublish={() =>
                      isPublished ? handleUnpublish() : handlePublish()
                    }
                    onUnpublish={handleUnpublish}
                    onRefine={() => setShowRefineChat(true)}
                    onOpenSettings={() => setShowCourseSettings(true)}
                    onOpenPublishSettings={() => setShowPublishSettings(true)}
                    isPublishing={isPublishing}
                    isPublished={isPublished}
                    isVisualEditMode={true}
                    isCreatorView={true}
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    Describe your course idea to get started →
                  </p>
                </div>
              )}
            </div>
          </ResizablePanel>

          {/* Right — Refine Chat (conditional) */}
          {showRefineChat && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25} minSize={18} maxSize={35}>
                <RefineChat
                  open={showRefineChat}
                  onOpenChange={setShowRefineChat}
                  onRefine={handleRefine}
                  isRefining={false}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* ── Dialogs ──────────────────────────────────────── */}
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
