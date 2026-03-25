import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────

export interface SaveCourseParams {
  userId: string;
  title?: string;
  description?: string;
  modules?: any[];
  difficulty?: string;
  durationWeeks?: number;
  designConfig?: object;
  layoutTemplate?: string;
  sectionOrder?: string[];
  pageSections?: object;
  builderProjectId?: string;
  offerType?: string;
}

// ── Helpers ─────────────────────────────────────────────────

function generateSubdomain(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50);
  const suffix = Array.from({ length: 6 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(Math.random() * 36))
  ).join("");
  return `${base}-${suffix}`;
}

// ── CRUD Functions ──────────────────────────────────────────

export async function saveCourseToDatabase(
  params: SaveCourseParams
): Promise<{ id: string; error?: string } | null> {
  console.log("💾 [saveCourse] START — params:", JSON.stringify({
    userId: params.userId,
    title: params.title,
    modulesCount: params.modules?.length ?? 0,
    difficulty: params.difficulty,
    offerType: params.offerType,
    hasDesignConfig: !!params.designConfig,
    hasBuilderProjectId: !!params.builderProjectId,
  }));

  const {
    userId,
    title = "Untitled Course",
    description,
    modules = [],
    difficulty = "beginner",
    durationWeeks = 6,
    designConfig = {
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
      heroStyle: "gradient",
      borderRadius: "medium",
    },
    layoutTemplate = "suspended",
    sectionOrder,
    pageSections,
    builderProjectId,
    offerType = "course",
  } = params;

  // Map offerType to valid check constraint values
  const VALID_TYPES = ["course", "challenge", "coach", "lead_magnet", "webinar"];
  const resolvedType = VALID_TYPES.includes(offerType) ? offerType : "course";

  if (!userId) {
    console.error("💾 [saveCourse] ABORT — no userId provided");
    toast.error("Cannot save: you are not signed in.");
    return null;
  }

  // Verify auth session is valid
  const { data: sessionData } = await supabase.auth.getSession();
  console.log("💾 [saveCourse] Auth session exists:", !!sessionData?.session, "uid:", sessionData?.session?.user?.id);

  if (!sessionData?.session) {
    console.error("💾 [saveCourse] ABORT — no active Supabase session");
    toast.error("Session expired. Please sign in again.");
    return null;
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  for (let attempt = 0; attempt < 3; attempt++) {
    const subdomain = generateSubdomain(title);

    const payload = {
      user_id: userId,
      title,
      description: description ?? null,
      slug: `${slug}-${subdomain.slice(-6)}`,
      subdomain,
      curriculum: modules as any,
      status: "draft",
      type: resolvedType,
      design_config: designConfig as any,
      layout_template: layoutTemplate,
      section_order: sectionOrder as any,
      page_sections: pageSections as any,
      builder_project_id: builderProjectId ?? null,
      meta: { difficulty, duration_weeks: durationWeeks } as any,
    };

    console.log(`💾 [saveCourse] Attempt ${attempt + 1}/3 — inserting with slug:`, payload.slug);

    const { data, error } = await supabase
      .from("courses")
      .insert(payload)
      .select("id")
      .single();

    if (!error && data) {
      console.log("✅ [saveCourse] SUCCESS — course id:", data.id);
      return { id: data.id };
    }

    // Retry only on unique constraint violation (code 23505)
    if (error?.code === "23505") {
      console.warn(`💾 [saveCourse] Subdomain collision (attempt ${attempt + 1}/3), retrying...`);
      continue;
    }

    const errorDetail = `Code: ${error?.code}, Message: ${error?.message}, Details: ${error?.details}, Hint: ${error?.hint}`;
    console.error("❌ [saveCourse] FAILED:", errorDetail);
    console.error("❌ [saveCourse] Full error:", JSON.stringify(error, null, 2));
    console.error("❌ [saveCourse] Payload keys:", Object.keys(payload).join(", "));
    toast.error(`Failed to save course: ${error?.message || "Unknown error"}`);
    return null;
  }

  console.error("💾 [saveCourse] FAILED after 3 attempts (subdomain collisions)");
  return null;
}

export async function updateCourseInDatabase(
  courseId: string,
  updates: Record<string, unknown>
): Promise<boolean> {
  const { error } = await supabase
    .from("courses")
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq("id", courseId);

  if (error) {
    console.error("Failed to update course:", error);
    toast.error(`Failed to update course: ${error.message}`);
    return false;
  }
  return true;
}

export async function ensureCourseExists(params: {
  projectId: string;
  userId: string;
  title?: string;
  modules?: any[];
}): Promise<string | null> {
  const { projectId, userId, title, modules } = params;

  const { data: rows, error } = await supabase
    .from("courses")
    .select("id")
    .eq("builder_project_id", projectId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1);

  const existing = rows?.[0] ?? null;
  if (!error && existing) {
    return existing.id;
  }

  const result = await saveCourseToDatabase({
    userId,
    title,
    modules,
    builderProjectId: projectId,
  });

  return result?.id ?? null;
}

// ── Soft Delete ────────────────────────────────────────────

export async function softDeleteCourse(courseId: string): Promise<boolean> {
  // The BEFORE DELETE trigger converts this to a soft-delete automatically,
  // but we can also do it explicitly for clarity and to avoid trigger reliance.
  const { error } = await supabase
    .from("courses")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any)
    .eq("id", courseId);

  if (error) {
    console.error("Failed to soft-delete course:", error);
    toast.error(`Failed to delete course: ${error.message}`);
    return false;
  }
  return true;
}

export async function restoreCourse(courseId: string): Promise<boolean> {
  const { error } = await supabase
    .from("courses")
    .update({ deleted_at: null, updated_at: new Date().toISOString() } as any)
    .eq("id", courseId);

  if (error) {
    console.error("Failed to restore course:", error);
    toast.error(`Failed to restore course: ${error.message}`);
    return false;
  }
  toast.success("Course restored successfully.");
  return true;
}

// ── Version History ────────────────────────────────────────

export interface CourseVersion {
  id: string;
  course_id: string;
  version_number: number;
  snapshot: Record<string, any>;
  change_source: string;
  created_at: string;
}

export async function getCourseVersions(
  courseId: string
): Promise<CourseVersion[]> {
  const { data, error } = await supabase
    .from("course_versions")
    .select("*")
    .eq("course_id", courseId)
    .order("version_number", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to fetch course versions:", error);
    return [];
  }
  return (data ?? []) as unknown as CourseVersion[];
}

export async function restoreCourseVersion(
  courseId: string,
  versionId: string
): Promise<boolean> {
  // 1. Fetch the version snapshot
  const { data: version, error: fetchError } = await supabase
    .from("course_versions")
    .select("snapshot")
    .eq("id", versionId)
    .eq("course_id", courseId)
    .single();

  if (fetchError || !version) {
    console.error("Failed to fetch version:", fetchError);
    toast.error("Could not find that version.");
    return false;
  }

  const snapshot = version.snapshot as Record<string, any>;

  // 2. Apply the snapshot back to the course (this will trigger a new version snapshot of current state first)
  const { error: updateError } = await supabase
    .from("courses")
    .update({
      title: snapshot.title,
      description: snapshot.description,
      tagline: snapshot.tagline,
      curriculum: snapshot.curriculum,
      design_config: snapshot.design_config,
      layout_template: snapshot.layout_template,
      section_order: snapshot.section_order,
      page_sections: snapshot.page_sections,
      meta: snapshot.meta,
      status: snapshot.status,
      price_cents: snapshot.price_cents,
      branding: snapshot.branding,
      hero_copy: snapshot.hero_copy,
      thumbnail_url: snapshot.thumbnail_url,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", courseId);

  if (updateError) {
    console.error("Failed to restore version:", updateError);
    toast.error(`Failed to restore version: ${updateError.message}`);
    return false;
  }

  toast.success("Course restored to previous version.");
  return true;
}
