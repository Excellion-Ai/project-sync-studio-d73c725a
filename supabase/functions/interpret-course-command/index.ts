import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are a course builder AI. The user describes changes to their course and you return a JSON object with the specific updates to apply.

Return a JSON object with:
{
  "action": "update_design" | "update_content" | "update_layout" | "update_structure" | "add_section" | "multiple",
  "changes": {
    // Include ONLY the fields that need to change. Examples:

    // Colors: { "design_config": { "colors": { "primary": "#ff0000", "background": "#ffffff" } } }
    // Fonts: { "design_config": { "fonts": { "heading": "Poppins", "body": "Open Sans" } } }
    // Layout style: { "layout_template": "creator" | "technical" | "academic" | "visual" }
    // Section order: { "section_order": ["hero", "outcomes", "curriculum", "instructor", "faq"] }
    // Title: { "title": "New Course Title" }
    // Description: { "description": "New description" }
    // Tagline: { "tagline": "New tagline" }
    // Modules: { "modules": [...full updated modules array] }
    // Page sections: { "pages": { "instructor": { "name": "...", "bio": "..." }, "faq": [...] } }
    // Hero style: { "design_config": { "heroStyle": "gradient" | "solid" | "split" } }
    // Spacing: { "design_config": { "spacing": "compact" | "normal" | "relaxed" } }
    // Border radius: { "design_config": { "borderRadius": "none" | "small" | "medium" | "large" } }

    // You can combine multiple changes in a single response.
  },
  "explanation": "Brief 1-sentence explanation of what was changed"
}

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown fences
- For color changes, change ALL relevant color fields to create a cohesive palette
- For layout changes, use one of: "creator", "technical", "academic", "visual"
- Available landing page sections: hero, outcomes, curriculum, instructor, pricing, faq, who_is_for, course_includes, testimonials, guarantee, bonuses, community, certificate
- When updating modules, include the FULL modules array with all modules (not just changed ones)
- For content changes like title/description, put them directly in changes (not nested)
- Always provide a helpful explanation of what you changed`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: authData, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("ANTHROPIC_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const body = await req.json();
    const command = body.command;
    const currentCourse = body.current_course || body.currentCourse;
    const currentDesign = body.current_design || body.currentDesign;
    if (!command) throw new Error("command is required");

    // Send a compact summary instead of the full course to save tokens
    const courseSummary = {
      title: currentCourse?.title,
      description: currentCourse?.description,
      tagline: currentCourse?.tagline,
      layout_style: currentCourse?.layout_style || currentCourse?.layout_template,
      section_order: currentCourse?.section_order,
      modules: (currentCourse?.modules || []).map((m: any) => ({
        id: m.id, title: m.title, description: m.description,
        lessons: (m.lessons || []).map((l: any) => ({ id: l.id, title: l.title, type: l.type })),
      })),
    };

    const userMessage = `User command: "${command}"

Current course:
${JSON.stringify(courseSummary, null, 2)}

Current design config:
${JSON.stringify(currentDesign, null, 2)}

Return the changes as JSON only.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse command interpretation");
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interpret-course-command error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
