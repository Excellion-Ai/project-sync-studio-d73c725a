import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-20250514";
const REQUEST_TIMEOUT_MS = 20000;
const MAX_TOKENS = 1500;

const SYSTEM_PROMPT = `You are an expert course creator and web designer. Generate a course OUTLINE with a UNIQUE visual design as compact valid JSON.

RULES:
- Return exactly 5 modules unless the user explicitly asks for a different size
- Return exactly 3 lessons per module
- Each lesson gets a title and a 1-sentence description ONLY — no full content
- The subtitle must be a concrete benefit statement and must not repeat the title
- Module and lesson titles must be specific, not generic placeholders
- Include exactly 6 measurable learning outcomes
- Generate a UNIQUE design_config for every course — never reuse the same palette
- Generate 3-4 relevant FAQ questions and answers specific to this course topic
- Generate a target_audience description (1-2 sentences about who this is for)
- Choose a section_order that suits the course topic (vary it between courses)
- Return ONLY the requested JSON keys

DESIGN RULES — every course MUST look different:
- Pick a color palette that matches the course topic/mood (e.g. fitness=energetic, coding=cool/techy, business=professional, wellness=calm)
- Choose from these font pairings (pick ONE pairing, vary between courses):
  * "Playfair Display" + "DM Sans" (elegant/editorial)
  * "Space Grotesk" + "Inter" (modern/tech)
  * "Poppins" + "Inter" (clean/friendly)
  * "Montserrat" + "DM Sans" (bold/professional)
  * "Lora" + "Inter" (warm/academic)
  * "DM Sans" + "Inter" (minimal/sleek)
  * "Merriweather" + "DM Sans" (classic/authoritative)
- Pick heroStyle from: "gradient", "minimal", "split", "centered", "image"
- Pick heroLayout from: "left", "centered", "split", "image_background"
  * "left": text left-aligned, classic layout (default)
  * "centered": text and CTA centered
  * "split": text left, image right in a 50/50 grid
  * "image_background": full-bleed background image with text overlay
- Vary heroLayout between courses — don't always use "left"
- Pick spacing from: "compact", "normal", "spacious"
- Pick borderRadius from: "none", "small", "medium", "large"
- Default to dark backgrounds (#0a-#15 range) with light text for premium feel, BUT if the user explicitly requests light/white backgrounds, honor their request
- primary color must be a VIBRANT accent/brand color (NOT the same as background or text). It's used for buttons, icons, and highlights — it MUST contrast against both background and text
- accent should complement primary but be distinct
- cardBackground should be slightly lighter than background (for dark themes) or slightly darker (for light themes)
- NEVER set primary to the same color as background or text — that makes UI elements invisible

OUTPUT FORMAT:
{
  "title": "string",
  "subtitle": "string",
  "description": "string (2-3 sentences for the sales page)",
  "learningOutcomes": ["string","string","string","string","string","string"],
  "modules": [
    {
      "title": "string",
      "description": "string (1 sentence)",
      "lessons": [
        { "title": "string", "description": "string (1 sentence)" }
      ]
    }
  ],
  "design_config": {
    "colors": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "background": "#hex",
      "cardBackground": "#hex",
      "text": "#hex",
      "textMuted": "#hex"
    },
    "fonts": { "heading": "string", "body": "string" },
    "spacing": "compact|normal|spacious",
    "borderRadius": "none|small|medium|large",
    "heroStyle": "gradient|minimal|split|centered|image",
    "heroLayout": "left|centered|split|image_background"
  },
  "target_audience": "string (1-2 sentences)",
  "faq": [
    { "question": "string", "answer": "string" }
  ],
  "section_order": ["hero", "outcomes", "who_is_for", "curriculum", "course_includes", "testimonials", "pricing", "guarantee", "faq"]
}

SECTION OPTIONS (pick 7-10 in a logical order, always start with "hero"):
hero, outcomes, who_is_for, curriculum, course_includes, instructor, testimonials, pricing, guarantee, faq, bonuses, community, certificate`;

function parseCourseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse course JSON from AI response");
    return JSON.parse(jsonMatch[0]);
  }
}

function isTimeoutError(error: unknown) {
  return error instanceof Error && (
    error.name === "TimeoutError" ||
    error.name === "AbortError" ||
    error.message.toLowerCase().includes("timed out")
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("generate-course invoked (outline + design)");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: authData, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !authData?.user) {
      console.error("generate-course auth failed", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("generate-course auth ok", authData.user.id);

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("ANTHROPIC_KEY");
    if (!anthropicApiKey) {
      console.error("ANTHROPIC_API_KEY not found in env");
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const { prompt, options } = await req.json();
    if (!prompt || typeof prompt !== "string") throw new Error("prompt is required");

    // Generate a random seed to encourage variety
    const designSeed = Math.random().toString(36).slice(2, 6);

    const userMessage = `Create a course OUTLINE with UNIQUE visual design about: ${prompt}

Requirements:
- Difficulty level: ${options?.difficulty || "beginner"}
- Target duration: ${options?.duration_weeks || 6} weeks
${options?.template ? `- Layout style preference: ${options.template}` : ""}

Important:
- Default to exactly 5 modules with exactly 3 lessons each
- Only return titles for lessons — NO content or assignments
- Subtitle must describe the transformation, not repeat the title
- Learning outcomes must be unique to this topic
- Design must be UNIQUE — use design seed "${designSeed}" to inspire a distinct palette
- Pick colors that match the course topic mood (DO NOT default to gold/amber)
- Include 3-4 topic-specific FAQ entries
- Include a target_audience description
- Vary the section_order — don't always use the same arrangement
- Return ONLY valid JSON`;

    console.log("generate-course requesting Anthropic outline with model:", MODEL);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.8,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    console.log("generate-course Anthropic status", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      throw new Error(`Anthropic API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const course = parseCourseJson(text);

    if (!course?.title || !Array.isArray(course?.modules) || course.modules.length === 0) {
      throw new Error("AI response missing required course fields");
    }

    console.log("generate-course outline success:", course.title, course.modules.length, "modules",
      course.design_config ? "with design" : "no design");

    return new Response(JSON.stringify(course), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-course error:", e);

    const status = isTimeoutError(e) ? 504 : 500;
    const message = isTimeoutError(e)
      ? "Course outline generation timed out. Please try again."
      : e instanceof Error
        ? e.message
        : "Unknown error";

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
