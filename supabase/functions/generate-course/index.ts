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
- Generate 5-8 modules minimum
- Each module must have 3-5 lessons
- Module titles must be specific and engaging, never generic like 'Module 1: Introduction'. Use descriptive titles like 'Week 1: Building Your Foundation Without Equipment'
- What You'll Learn must list 6 specific, measurable outcomes unique to this course topic
- Each lesson must contain 300+ words of actionable, specific content in markdown format
- Include practical exercises, assignments, or action items in every lesson
- The course description must sell the transformation the student will experience
- Generate a unique design color palette that matches the course topic's mood

OUTPUT FORMAT: Return ONLY valid JSON (no markdown fences) with this exact structure:
{
  "title": "string",
  "subtitle": "string (NEVER repeat the title - must be a benefit statement)",
  "description": "string (2-3 compelling paragraphs)",
  "tagline": "string (short punchy tagline)",
  "difficulty": "beginner|intermediate|advanced",
  "duration_weeks": number,
  "learningOutcomes": ["6 specific measurable outcomes unique to this topic"],
  "modules": [
    {
      "id": "mod-0",
      "title": "Descriptive module title (NOT generic like Module 1)",
      "description": "What students will accomplish in this module",
      "lessons": [
        {
          "id": "mod-0-les-0",
          "title": "Specific lesson title",
          "duration": "20m",
          "type": "text",
          "content_markdown": "300+ words of actionable content in markdown with headers, lists, examples",
          "assignment_brief": "Practical exercise or action item for this lesson"
        }
      ]
    }
  ],
  "design_config": {
    "colors": {
      "primary": "#hex matching course mood",
      "secondary": "#1a1a1a",
      "accent": "#hex complementary accent",
      "background": "#0a0a0a",
      "cardBackground": "#111111",
      "text": "#ffffff",
      "textMuted": "#9ca3af"
    },
    "fonts": {"heading": "Inter", "body": "Inter"},
    "spacing": "normal",
    "borderRadius": "medium",
    "heroStyle": "gradient"
  },
  "pages": {
    "landing_sections": ["hero", "outcomes", "curriculum", "instructor", "faq"]
  }
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { prompt, options } = await req.json();
    if (!prompt) throw new Error("prompt is required");

    const userMessage = `Create a complete, detailed course about: ${prompt}

Requirements:
- Difficulty level: ${options?.difficulty || "beginner"}
- Target duration: ${options?.duration_weeks || 6} weeks
${options?.includeQuizzes ? "- Include quiz questions for knowledge checks in each module" : ""}
${options?.includeAssignments ? "- Include detailed practical assignments for each module" : ""}
${options?.template ? `- Layout style preference: ${options.template}` : ""}

Remember:
- Generate 5-8 modules with 3-5 lessons each
- Every lesson needs 300+ words of real, actionable content
- Module titles must be specific and descriptive, NOT generic
- The subtitle must describe the transformation, NOT repeat the title
- Learning outcomes must be specific to THIS topic (6 outcomes)
- Include assignments/exercises in every lesson

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
        max_tokens: 16384,
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
