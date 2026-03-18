import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `You are an expert course creator. Generate a comprehensive, professional online course based on the user's topic.

RULES:
- The subtitle must be a specific benefit statement, NEVER repeat the title. Example: for 'Home Workout Fundamentals' use 'Build strength and flexibility at home in just 20 minutes a day with zero equipment'
- Generate 5-8 modules minimum, but prefer the minimum valid size unless the topic truly requires more depth
- Each module must have 3-5 lessons, but prefer 3 lessons per module unless more are essential
- Module titles must be specific and engaging, never generic like 'Module 1: Introduction'. Use descriptive titles like 'Week 1: Building Your Foundation Without Equipment'
- What You'll Learn must list 6 specific, measurable outcomes unique to this course topic
- Each lesson must contain 300+ words of actionable, specific content
- Include practical exercises, assignments, or action items in every lesson
- The course description must sell the transformation the student will experience
- Keep the JSON compact and valid. Do not include any extra keys beyond the requested structure

OUTPUT FORMAT: Return ONLY valid JSON (no markdown fences) with this exact structure:
{
  "title": "string",
  "subtitle": "string (NEVER repeat the title - must be a benefit statement)",
  "description": "string (2-3 compelling paragraphs)",
  "learningOutcomes": ["6 specific measurable outcomes unique to this topic"],
  "modules": [
    {
      "title": "Descriptive module title (NOT generic like Module 1)",
      "lessons": [
        {
          "title": "Specific lesson title",
          "content": "300+ words of actionable content",
          "assignment": "Practical exercise or action item for this lesson"
        }
      ]
    }
  ]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    console.log("generate-course invoked");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: authData, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !authData?.user) {
      console.error("generate-course auth failed", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("ANTHROPIC_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { prompt, options } = await req.json();
    if (!prompt) throw new Error("prompt is required");

    const userMessage = `Create a complete, detailed course about: ${prompt}

Requirements:
- Difficulty level: ${options?.difficulty || "beginner"}
- Target duration: ${options?.duration_weeks || 6} weeks
${options?.includeAssignments ? "- Include practical assignments in each lesson" : ""}
${options?.template ? `- Layout style preference: ${options.template}` : ""}

Important:
- Prefer 5 modules and 3 lessons per module unless the topic genuinely needs more
- Every lesson needs 300+ words of real, actionable content
- Module titles must be specific and descriptive, NOT generic
- The subtitle must describe the transformation, NOT repeat the title
- Learning outcomes must be specific to THIS topic (6 outcomes)
- Include an assignment/action item in every lesson
- Return ONLY the requested JSON keys: title, subtitle, description, learningOutcomes, modules

Return ONLY valid JSON, no markdown fences.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 12000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    let course;
    try {
      course = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        course = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse course JSON from AI response");
      }
    }

    if (!course?.title || !Array.isArray(course?.modules)) {
      throw new Error("AI response missing required course fields");
    }

    return new Response(JSON.stringify(course), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-course error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
