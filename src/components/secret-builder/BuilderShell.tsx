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

  // Use AI-generated design config, falling back to defaults only for missing fields
  const aiDesign = ai.design_config || {};
  const designConfig = {
    colors: {
      ...DEFAULT_DESIGN_CONFIG.colors,
      ...(aiDesign.colors || {}),
    },
    fonts: {
      ...DEFAULT_DESIGN_CONFIG.fonts,
      ...(aiDesign.fonts || {}),
    },
    spacing: aiDesign.spacing || DEFAULT_DESIGN_CONFIG.spacing,
    borderRadius: aiDesign.borderRadius || DEFAULT_DESIGN_CONFIG.borderRadius,
    heroStyle: aiDesign.heroStyle || DEFAULT_DESIGN_CONFIG.heroStyle,
  };

  // Use AI-generated section order or fall back to a rich default
  const sectionOrder = ai.section_order || [
    "hero", "outcomes", "who_is_for", "curriculum",
    "course_includes", "testimonials", "pricing", "guarantee", "faq",
  ];

  // Build pages object with AI-generated content
  const pages = {
    landing_sections: sectionOrder,
    target_audience: ai.target_audience || undefined,
    faq: ai.faq || undefined,
    ...(ai.pages || {}),
  };

  return {
    title: ai.title || "Untitled Course",
    description: ai.description || "",
    tagline: ai.subtitle || ai.tagline || "",
    difficulty: ai.difficulty || options.difficulty,
    duration_weeks: ai.duration_weeks || options.duration_weeks,
    layout_style: options.template,
    learningOutcomes: ai.learningOutcomes || [],
    modules,
    pages,
    section_order: sectionOrder,
    design_config: designConfig,
  };
}

const GENERATION_STEPS: GenerationStep[] = [
  { id: "analyze", label: "Analyzing your idea", status: "pending" },
  { id: "structure", label: "Building course outline", status: "pending" },
  { id: "save-outline", label: "Saving to database", status: "pending" },
  { id: "design", label: "Applying design theme", status: "pending" },
  { id: "save", label: "Finalizing course", status: "pending" },
];

function getEdgeFunctionErrorMessage(raw: string) {
  const jsonStart = raw.indexOf('{"error":');
  if (jsonStart === -1) return "";

  try {
    const parsed = JSON.parse(raw.slice(jsonStart));
    return typeof parsed?.error === "string" ? parsed.error : "";
  } catch {
    return "";
  }
}

// ── Component ───────────────────────────────────────────────

interface BuilderShellProps {
  initialIdea?: string;
  initialProjectId?: string | null;
  initialCourseId?: string;
  templateSpec?: any;
  courseMode?: string;
  initialPdfBase64?: string;
  initialPdfName?: string;
}

const BuilderShell = ({
  initialIdea,
  initialProjectId,
  initialCourseId,
  initialPdfBase64,
  initialPdfName,
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

  // Generation — consume and clear localStorage idea + draft immediately to prevent cross-project leaks
  const resolvedIdea = initialIdea || localStorage.getItem("builder-initial-idea") || "";
  const resolvedDraft = (() => {
    try {
      const raw = localStorage.getItem("builder-draft");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  if (typeof window !== "undefined") {
    localStorage.removeItem("builder-initial-idea");
    localStorage.removeItem("builder-draft");
  }
  const [idea, setIdea] = useState(resolvedIdea);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>(() => {
    // If a PDF was passed from the Hub via router state, inject it as an attachment
    if (initialPdfBase64 && initialPdfName) {
      return [{
        id: crypto.randomUUID(),
        name: initialPdfName,
        type: "file",
        mimeType: "application/pdf",
        base64Data: initialPdfBase64,
        content: `[PDF will be sent directly to AI for reading — ${initialPdfName}]`,
      }];
    }
    return [];
  });

  // Publishing & Refining
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

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

  // ── Load existing course when reopening a saved project ───
  useEffect(() => {
    if (!projectId || !userId || courseSpec) return;
    const loadExisting = async () => {
      const { data: rows, error } = await supabase
        .from("courses")
        .select("*")
        .eq("builder_project_id", projectId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(1);

      const data = rows?.[0] ?? null;
      if (error || !data) {
        console.log("📂 No existing course found for project:", projectId);
        return;
      }

      console.log("📂 Loading saved course:", data.id, data.title);
      setCourseId(data.id);
      setIsPublished(data.status === "published");
      if (data.custom_domain && data.domain_verified) {
        setCoursePublishedUrl(`https://${data.custom_domain}`);
      } else if (data.slug || data.subdomain) {
        setCoursePublishedUrl(`https://excellioncourses.com/course/${data.slug || data.subdomain}`);
      }

      // Rebuild ExtendedCourse from DB row
      const modules = Array.isArray(data.curriculum) ? data.curriculum : [];
      const designConfig = (data.design_config as any) || DEFAULT_DESIGN_CONFIG;
      const pageSections = (data.page_sections as any) || {
        landing_sections: ["hero", "outcomes", "curriculum", "instructor", "faq"],
      };
      const sectionOrder = Array.isArray(data.section_order)
        ? data.section_order
        : pageSections?.landing_sections;
      const meta = (data.meta as any) || {};

      const loaded: ExtendedCourse = {
        id: data.id,
        title: data.title,
        description: data.description || "",
        tagline: data.tagline || "",
        difficulty: meta.difficulty || "beginner",
        duration_weeks: meta.duration_weeks || 6,
        layout_style: (data.layout_template || "creator") as ExtendedCourse["layout_style"],
        layout_template: data.layout_template || "suspended",
        learningOutcomes: [],
        modules: (modules as any[]).map((mod: any, i: number) => ({
          id: mod.id || `mod-${i}`,
          title: mod.title || `Module ${i + 1}`,
          description: mod.description || "",
          is_first: i === 0,
          is_last: i === (modules as any[]).length - 1,
          lessons: (mod.lessons || []).map((les: any, j: number) => ({
            id: les.id || `mod-${i}-les-${j}`,
            title: les.title || `Lesson ${j + 1}`,
            duration: les.duration || "20m",
            type: les.type || "text",
            description: les.description || "",
            content_markdown: les.content_markdown || "",
            video_url: les.video_url,
            quiz_questions: les.quiz_questions,
            passing_score: les.passing_score,
            assignment_brief: les.assignment_brief,
          })),
        })),
        pages: pageSections,
        section_order: sectionOrder,
        design_config: designConfig,
        thumbnail: data.thumbnail_url || "",
      };

      setCourseSpec(loaded);
      setIsDirty(false);
      setSaveStatus("saved");

      // Update settings from DB
      setCourseSettings((prev) => ({
        ...prev,
        instructorName: data.instructor_name || "",
        instructorBio: data.instructor_bio || "",
        thumbnail: data.thumbnail_url || "",
        seoTitle: data.seo_title || "",
        seoDescription: data.seo_description || "",
        offerType: data.type || "standard",
      }));
    };
    loadExisting();
  }, [projectId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-trigger generation ───────────────────────────────

  const handleGenerateCourseRef = useRef<((options: CourseOptions, overrideAttachments?: AttachmentItem[]) => Promise<void>) | null>(null);

  useEffect(() => {
    if (hasAutoTriggered || !resolvedIdea || !userId || isGenerating) return;
    if (!handleGenerateCourseRef.current) return;
    // Don't auto-trigger if we already loaded an existing course
    if (courseSpec) return;
    setHasAutoTriggered(true);
    localStorage.removeItem("builder-initial-idea");
    localStorage.removeItem("builder-draft");

    // Extract guided options from the structured draft
    const draftGuided = resolvedDraft?.guided || {};
    const durationWeeks = (() => {
      const raw = draftGuided.duration || "";
      const match = raw.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 6;
    })();
    const lessonFormat = (() => {
      const f = (draftGuided.format || "").toLowerCase();
      if (f.includes("video")) return "video" as const;
      if (f.includes("written") || f.includes("text")) return "written" as const;
      return "mixed" as const;
    })();

    const importedContentAttachment = draftGuided.attachmentText && !attachments.some((a) => a.name === "Imported content")
      ? {
          id: crypto.randomUUID(),
          name: "Imported content",
          type: "text" as const,
          content: draftGuided.attachmentText,
        }
      : null;

    const effectiveAttachments = importedContentAttachment
      ? [...attachments, importedContentAttachment]
      : attachments;

    if (importedContentAttachment) {
      setAttachments((prev) => {
        if (prev.some((a) => a.name === "Imported content")) return prev;
        return [...prev, importedContentAttachment];
      });
    }

    handleGenerateCourseRef.current(
      {
        difficulty: "beginner",
        duration_weeks: durationWeeks,
        includeQuizzes: true,
        includeAssignments: true,
        template: "creator",
        lessonFormat,
        audiencePainPoint: draftGuided.existingLink ? `Reference: ${draftGuided.existingLink}` : undefined,
      },
      effectiveAttachments
    );
  }, [attachments, userId, resolvedIdea, hasAutoTriggered, isGenerating, courseSpec]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!isDirty || !userId || isPublishing) return;
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
  }, [isDirty, courseSpec, siteSpec, courseId, projectId, userId, projectName, isPublishing]);

  // Mark dirty when specs change (skip initial mount)
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedRef.current) {
      // Skip the first render cycle (initial load from DB)
      if (courseSpec || siteSpec) hasInitializedRef.current = true;
      return;
    }
    if (courseSpec || siteSpec) setIsDirty(true);
  }, [courseSpec, siteSpec]);

  // ── handleGenerateCourse ──────────────────────────────────

  const handleGenerateCourse = useCallback(
    async (options: CourseOptions, sourceAttachments: AttachmentItem[] = attachments) => {
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
        // Collect text content from all attachments
        const attachmentContent = sourceAttachments
          .filter((a) => a.content)
          .map((a) => `--- Attached: ${a.name} ---\n${a.content}`)
          .join("\n\n");

        // Collect base64 PDF data for direct Claude document reading
        const pdfAttachment = sourceAttachments.find((a) =>
          a.base64Data && (
            a.mimeType === "application/pdf" ||
            a.name?.toLowerCase().endsWith(".pdf")
          )
        );
        const pdfBase64 = pdfAttachment?.base64Data;

        // Log what we're sending for debugging
        console.log("Generation attachments:", {
          totalAttachments: sourceAttachments.length,
          withContent: sourceAttachments.filter(a => a.content).length,
          contentLength: attachmentContent.length,
          hasPdfBase64: !!pdfBase64,
          pdfBase64Length: pdfBase64?.length ?? 0,
          attachmentNames: sourceAttachments.map(a => `${a.name} (type=${a.mimeType}, content=${(a.content?.length ?? 0)}chars, base64=${!!a.base64Data})`),
        });

        // Step 1: Generate outline
        updateStep("analyze", "in_progress");

        const outlineResponse = (await AI.generateCourse(ideaToUse, {
          difficulty: options.difficulty,
          duration_weeks: options.duration_weeks,
          includeQuizzes: options.includeQuizzes,
          includeAssignments: options.includeAssignments,
          template: options.template,
          lessonFormat: options.lessonFormat,
          audiencePainPoint: options.audiencePainPoint,
        }, attachmentContent || undefined, pdfBase64)) as Record<string, any>;

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
          if (saved.subdomain) {
            setCoursePublishedUrl(`${window.location.origin}/course/${saved.subdomain}`);
          }
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

        // Show specific error messages based on error type
        const msg = err?.message || "";
        const detail = getEdgeFunctionErrorMessage(msg) || msg;
        if (detail.includes("401") || detail.includes("Unauthorized") || detail.includes("session")) {
          toast.error("Session expired. Please sign in again.");
        } else if (detail.includes("429") || /rate limit/i.test(detail)) {
          toast.error(detail);
        } else if (detail.includes("504") || /timeout/i.test(detail)) {
          toast.error("Generation timed out. Please try again.");
        } else {
          toast.error(detail || "Generation failed.");
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [attachments, idea, userId, projectId, resetSiteSpec]
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
      // Fetch existing slug, subdomain, and custom domain
      const { data: existing } = await supabase
        .from("courses")
        .select("slug, subdomain, custom_domain, domain_verified")
        .eq("id", courseId)
        .single();

      // Generate a clean slug from the title
      const cleanSlug = (t: string) => t
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);

      let slug = existing?.slug;
      // Regenerate if slug has random suffix (old format) or doesn't match title
      const titleSlug = cleanSlug(courseSpec.title);
      if (!slug || slug !== titleSlug) {
        slug = titleSlug;
        // Check for duplicates
        const { data: dupes } = await supabase
          .from("courses")
          .select("slug")
          .like("slug", `${slug}%`)
          .neq("id", courseId)
          .is("deleted_at", null)
          .limit(20);
        const existing_slugs = new Set((dupes || []).map((d: any) => d.slug));
        if (existing_slugs.has(slug)) {
          let counter = 1;
          while (existing_slugs.has(`${slug}-${counter}`)) counter++;
          slug = `${slug}-${counter}`;
        }
      }

      // Keep subdomain in sync with slug for backwards compatibility
      const subdomain = existing?.subdomain || slug;

      // URL priority: verified custom domain > excellioncourses.com/course/:slug > origin fallback
      const hasCustomDomain = existing?.custom_domain && existing?.domain_verified;
      const publishedUrl = hasCustomDomain
        ? `https://${existing.custom_domain}`
        : `https://excellioncourses.com/course/${slug}`;

      const { error } = await supabase
        .from("courses")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          slug,
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

      // Layout template / style
      if (changes.layout_template) {
        updated.layout_template = changes.layout_template;
        updated.layout_style = changes.layout_template;
      }
      if (changes.layout_style) {
        updated.layout_style = changes.layout_style;
        updated.layout_template = changes.layout_style;
      }

      // Section order
      if (changes.section_order) updated.section_order = changes.section_order;

      // Content fields
      if (changes.title) updated.title = changes.title;
      if (changes.description) updated.description = changes.description;
      if (changes.tagline) updated.tagline = changes.tagline;

      // Curriculum / modules
      if (changes.curriculum && Array.isArray(changes.curriculum)) {
        updated.modules = changes.curriculum;
      }
      if (changes.modules && Array.isArray(changes.modules)) {
        updated.modules = changes.modules;
      }

      // Page sections (instructor, faq, bonuses, etc.)
      if (changes.pages) {
        updated.pages = { ...updated.pages, ...changes.pages };
      }

      setCourseSpec(updated);

      // Persist to DB
      if (courseId) {
        updateCourseInDatabase(courseId, {
          title: updated.title,
          description: updated.description,
          tagline: updated.tagline,
          design_config: updated.design_config,
          layout_template: updated.layout_template ?? updated.layout_style,
          section_order: updated.section_order,
          curriculum: updated.modules,
          page_sections: updated.pages,
        });
      }
    },
    [courseSpec, courseId]
  );

  // ── Refine ────────────────────────────────────────────────

  const handleRefine = useCallback(
    async (prompt: string) => {
      if (!courseSpec) return;
      setIsRefining(true);
      try {
        const result = (await AI.interpretCommand(
          prompt,
          courseSpec as any,
          courseSpec.design_config as any
        )) as Record<string, any>;

        if (result) {
          // The edge function returns { action, changes, explanation }
          // Unwrap the changes object and apply it
          const changesToApply = result.changes || result;
          handleApplyChanges(changesToApply);

          // Add assistant response to chat
          const explanation = result.explanation || "Changes applied.";
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", content: explanation },
          ]);
        }
      } catch (err: any) {
        toast.error(`Failed: ${err?.message}`);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: `Sorry, that didn't work: ${err?.message}` },
        ]);
      } finally {
        setIsRefining(false);
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
        courseUrl={courseUrl}
        onPublish={handlePublishCourse}
        onUnpublish={handleUnpublish}
        onRefine={() => {}}
        onOpenSettings={() => setShowCourseSettings(true)}
        onOpenPublishSettings={() => setShowPublishSettings(true)}
        onDesignUpdate={(config) => {
          if (courseSpec) {
            const updated = { ...courseSpec, design_config: config };
            setCourseSpec(updated);
            setIsDirty(true);
            setSaveStatus("unsaved");
          }
        }}
        currentDesignConfig={courseSpec?.design_config}
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
              isRefining={isRefining}
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
              onAddMessage={(msg) => setMessages((prev) => [...prev, msg])}
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
              logoUrl={courseSpec?.design_config?.logoUrl}
              onUpdateLogo={(url) => {
                if (!courseSpec) return;
                const updated = {
                  ...courseSpec,
                  design_config: { ...courseSpec.design_config, logoUrl: url },
                };
                handleCourseUpdate(updated);
              }}
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
