import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Dynamic CORS — allow production + Lovable preview domains
function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ["https://excellioncourses.com", "https://www.excellioncourses.com"];
  const isAllowed = allowed.includes(origin) || origin.endsWith(".lovable.app") || origin.endsWith(".lovableproject.com");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowed[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are a course builder AI that makes SURGICAL, PRECISE changes. The user describes changes to their course and you return a JSON object with ONLY the specific updates to apply.

CRITICAL RULE: Only change what the user explicitly asks to change. Do NOT modify, reorganize, or "improve" anything the user didn't mention. If they say "change the colors to blue", ONLY change colors — don't touch fonts, spacing, content, sections, or anything else.

Return a JSON object with:
{
  "action": "update_design" | "update_content" | "update_layout" | "update_structure" | "add_section" | "remove_section" | "multiple",
  "changes": {
    // Include ONLY the fields that need to change. Examples:

    // Colors: { "design_config": { "colors": { "primary": "#3b82f6", "accent": "#60a5fa" } } }
    // Fonts: { "design_config": { "fonts": { "heading": "Poppins", "body": "Open Sans" } } }
    // Hero layout: { "design_config": { "heroLayout": "left" | "centered" | "split" | "image_background" } }
    //   - "left": text left-aligned (default)
    //   - "centered": text and CTA centered, image shown below text if present
    //   - "split": text on left, image on right in a 50/50 grid
    //   - "image_background": full-bleed background image with text overlay
    // Hero image: { "design_config": { "heroImage": "https://images.unsplash.com/..." } }
    //   - Use a relevant Unsplash URL when the user asks to add an image to the hero
    //   - Pick an image that matches the course topic (fitness, yoga, cooking, etc.)
    // Hero style (visual feel): { "design_config": { "heroStyle": "gradient" | "minimal" | "split" | "centered" | "image" } }
    //   - "gradient": rich gradient overlays with radial glow (default, dramatic)
    //   - "minimal": clean solid background, subtle bottom border (simple, professional)
    //   - "split": split-tone background left-to-right
    //   - "centered": radial glow from center
    //   - "image": background image prominently visible with lighter overlay
    //   When setting heroStyle to "image" or heroLayout to "image_background" or "split", also set a heroImage URL
    // Spacing: { "design_config": { "spacing": "compact" | "normal" | "spacious" } }
    // Border radius: { "design_config": { "borderRadius": "none" | "small" | "medium" | "large" } }
    // Layout style: { "layout_template": "creator" | "technical" | "academic" | "visual" }
    // Section order: { "section_order": ["hero", "outcomes", "curriculum", ...] }
    // Title: { "title": "New Course Title" }
    // Description: { "description": "New description" }
    // Tagline: { "tagline": "New tagline" }
    // Modules: { "modules": [...full updated modules array] }
    // Page sections: { "pages": { "instructor": { "name": "...", "bio": "..." }, "faq": [...] } }

    // You can combine multiple changes in a single response when the user asks for multiple things.
  },
  "explanation": "Brief 1-sentence explanation of what was changed"
}

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown fences
- ONLY include fields the user asked to change — leave everything else untouched
- For color changes, create a cohesive palette across ALL color fields (primary, secondary, accent, background, cardBackground, text, textMuted)
- For font changes, only include font fields
- For content changes (title, description, tagline), put them directly in changes (not nested)
- When updating modules, include the FULL modules array with all modules
- Available sections: hero, outcomes, curriculum, instructor, pricing, faq, who_is_for, course_includes, testimonials, guarantee, bonuses, community, certificate
- Available font families: Inter, DM Sans, Playfair Display, Poppins, Space Grotesk, Montserrat, Lora, Merriweather, Open Sans, Raleway, Roboto Slab, Oswald
- NEVER change sections, fonts, spacing, layout, or content unless the user specifically asks for it
- If the user asks to "make it look more professional/modern/clean", only adjust design_config (colors, fonts, spacing) — not content
- Always provide a helpful explanation of what you changed`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getCorsHeaders(req) });

  try {
    // Payload size limit: 100KB
    const contentLength = parseInt(req.headers.get("content-length") || "0");
    if (contentLength > 102400) {
      return new Response(
        JSON.stringify({ error: "Request too large. Maximum payload size is 100KB." }),
        { status: 413, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }


    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: authData, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("ANTHROPIC_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const body = await req.json();
    const command = typeof body.command === "string" ? body.command.trim().slice(0, 2000) : "";
    const currentCourse = body.current_course || body.currentCourse;
    const currentDesign = body.current_design || body.currentDesign;
    if (!command) {
      return new Response(JSON.stringify({ error: "Please enter a command." }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── RATE LIMITING: 30 commands per hour per user ────────
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await adminClient
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authData.user.id)
      .eq("endpoint", "interpret-course-command")
      .gte("called_at", oneHourAgo);

    if ((count ?? 0) >= 30) {
      return new Response(JSON.stringify({
        error: "Rate limit reached for course edits. Please try again later.",
      }), {
        status: 429,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    await adminClient.from("rate_limits").insert({
      user_id: authData.user.id,
      endpoint: "interpret-course-command",
    });

    // Send a compact summary instead of the full course to save tokens
    const courseSummary = {
      title: currentCourse?.title,
      description: currentCourse?.description,
      tagline: currentCourse?.tagline,
      layout_style: currentCourse?.layout_style || currentCourse?.layout_template,
      heroLayout: currentDesign?.heroLayout || "left",
      heroImage: currentDesign?.heroImage || null,
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

REMEMBER: Only change what the user explicitly asked for. Do not modify anything else. Return changes as JSON only.`;

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
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interpret-course-command error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
