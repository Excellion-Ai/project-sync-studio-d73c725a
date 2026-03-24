import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-20250514";
const REQUEST_TIMEOUT_MS = 50000;
const MAX_TOKENS = 1200;

const SYSTEM_PROMPT = `You are an expert course creator. Generate a course OUTLINE as compact valid JSON.

RULES:
- Return exactly 5 modules unless the user explicitly asks for a different size
- Return exactly 3 lessons per module
- Each lesson gets a title and a 1-sentence description ONLY — no full content
- The subtitle must be a concrete benefit statement and must not repeat the title
- Module and lesson titles must be specific, not generic placeholders
- Include exactly 6 measurable learning outcomes
- Return ONLY the requested JSON keys

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
  ]
}`;

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
    console.log("generate-course invoked (outline only)");

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

    const userMessage = `Create a course OUTLINE (titles only, no lesson content) about: ${prompt}

Requirements:
- Difficulty level: ${options?.difficulty || "beginner"}
- Target duration: ${options?.duration_weeks || 6} weeks
${options?.template ? `- Layout style preference: ${options.template}` : ""}

Important:
- Default to exactly 5 modules with exactly 3 lessons each
- Only return titles for lessons — NO content or assignments
- Subtitle must describe the transformation, not repeat the title
- Learning outcomes must be unique to this topic
- Return ONLY valid JSON with the keys: title, subtitle, description, learningOutcomes, modules`;

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

    console.log("generate-course outline success:", course.title, course.modules.length, "modules");

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
