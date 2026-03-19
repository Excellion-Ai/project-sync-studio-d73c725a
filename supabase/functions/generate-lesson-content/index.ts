import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-20250514";
const REQUEST_TIMEOUT_MS = 20000;
const MAX_TOKENS = 2000;

const SYSTEM_PROMPT = `You are an expert course content writer. Generate detailed lesson content for a single lesson.

RULES:
- Return exactly one lesson
- The lesson must contain 300+ words of actionable, specific content
- Include a practical assignment or action step
- Keep the writing dense and useful, never fluffy
- Return ONLY the requested JSON

OUTPUT FORMAT:
{
  "lessons": [
    {
      "title": "string",
      "content": "string (300+ words of lesson content in markdown)",
      "assignment": "string (practical exercise or action step)"
    }
  ]
}`;

function parseLessonJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse lesson JSON from AI response");
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
    console.log("generate-lesson-content invoked");

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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("ANTHROPIC_KEY");
    if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { courseTitle, moduleTitle, lessonTitle, lessonTitles, difficulty, includeAssignments } = await req.json();

    const resolvedLessonTitle = typeof lessonTitle === "string" && lessonTitle.trim()
      ? lessonTitle.trim()
      : Array.isArray(lessonTitles) && lessonTitles.length === 1 && typeof lessonTitles[0] === "string"
        ? lessonTitles[0].trim()
        : "";

    if (!moduleTitle || !resolvedLessonTitle) {
      throw new Error("moduleTitle and lessonTitle are required");
    }

    const userMessage = `Generate detailed lesson content for the lesson "${resolvedLessonTitle}" from the module "${moduleTitle}" in the course "${courseTitle || ""}".

Difficulty: ${difficulty || "beginner"}

Requirements:
- Write exactly one lesson
- Provide 300+ words of real, actionable content in markdown
${includeAssignments !== false ? "- Include a practical assignment" : "- Include a practical action step"}
- Content must be specific to the topic, not generic filler
- Return ONLY valid JSON with a "lessons" array containing exactly one lesson`;

    console.log("generate-lesson-content requesting content for lesson:", resolvedLessonTitle);

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

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const parsed = parseLessonJson(text);

    if (!Array.isArray(parsed?.lessons) || parsed.lessons.length !== 1) {
      throw new Error("AI response must contain exactly one lesson");
    }

    const normalized = {
      lessons: parsed.lessons.map((lesson: any) => ({
        title: lesson?.title || resolvedLessonTitle,
        content: lesson?.content || "",
        assignment: lesson?.assignment || "",
      })),
    };

    console.log("generate-lesson-content success for lesson:", resolvedLessonTitle);

    return new Response(JSON.stringify(normalized), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-lesson-content error:", e);

    const status = isTimeoutError(e) ? 504 : 500;
    const message = isTimeoutError(e)
      ? "Lesson content generation timed out. Please try again."
      : e instanceof Error ? e.message : "Unknown error";

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});