import { supabase } from "@/integrations/supabase/client";

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
): Promise<{ id: string } | null> {
  const {
    userId,
    title = "Untitled Course",
    description,
    modules = [],
    difficulty = "beginner",
    durationWeeks = 6,
    designConfig = {},
    layoutTemplate = "suspended",
    sectionOrder,
    pageSections,
    builderProjectId,
    offerType = "standard",
  } = params;

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  for (let attempt = 0; attempt < 3; attempt++) {
    const subdomain = generateSubdomain(title);

    const { data, error } = await supabase
      .from("courses")
      .insert({
        user_id: userId,
        title,
        description: description ?? null,
        slug: `${slug}-${subdomain.slice(-6)}`,
        subdomain,
        curriculum: modules as any,
        status: "draft",
        type: offerType,
        design_config: designConfig as any,
        layout_template: layoutTemplate,
        section_order: sectionOrder as any,
        page_sections: pageSections as any,
        builder_project_id: builderProjectId ?? null,
        meta: { difficulty, duration_weeks: durationWeeks } as any,
      })
      .select("id")
      .single();

    if (!error && data) {
      return { id: data.id };
    }

    // Retry only on unique constraint violation (code 23505)
    if (error?.code === "23505") {
      console.warn(`Subdomain collision (attempt ${attempt + 1}/3), retrying...`);
      continue;
    }

    console.error("Failed to save course:", error);
    return null;
  }

  console.error("Failed to save course after 3 attempts (subdomain collisions)");
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

  const { data: existing, error } = await supabase
    .from("courses")
    .select("id")
    .eq("builder_project_id", projectId)
    .maybeSingle();

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
