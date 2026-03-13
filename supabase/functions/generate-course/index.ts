import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `You are an expert course curriculum designer. Given a course idea and optional parameters, generate a complete course structure as JSON.

Return a JSON object with:
{
  "title": "Course title",
  "description": "Course description",
  "tagline": "Short tagline",
  "difficulty": "beginner|intermediate|advanced",
  "duration_weeks": number,
  "learningOutcomes": ["outcome1", "outcome2", ...],
  "modules": [
    {
      "id": "mod-0",
      "title": "Module title",
      "description": "Module description",
      "lessons": [
        {
          "id": "mod-0-les-0",
          "title": "Lesson title",
          "duration": "15m",
          "type": "text|video|quiz|assignment",
          "content_markdown": "Lesson content in markdown (for text lessons)",
          "quiz_questions": [{"id":"q1","question":"...","type":"multiple_choice","options":["a","b","c","d"],"correct_index":0,"explanation":"..."}],
          "assignment_brief": "Assignment description (for assignment lessons)"
        }
      ]
    }
  ],
  "design_config": {
    "colors": {"primary":"#d4a853","secondary":"#1a1a1a","accent":"#f59e0b","background":"#0a0a0a","cardBackground":"#111111","text":"#ffffff","textMuted":"#9ca3af"},
    "fonts": {"heading":"Inter","body":"Inter"},
    "spacing": "normal",
    "borderRadius": "medium",
    "heroStyle": "gradient"
  },
  "pages": {
    "landing_sections": ["hero","outcomes","curriculum","instructor","faq"]
  }
}

Generate detailed, real lesson content. Include quiz questions if requested. Make content engaging and practical.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { prompt, options } = await req.json();
    if (!prompt) throw new Error("prompt is required");

    const userMessage = `Create a course about: ${prompt}
${options?.difficulty ? `Difficulty: ${options.difficulty}` : ""}
${options?.duration_weeks ? `Duration: ${options.duration_weeks} weeks` : ""}
${options?.includeQuizzes ? "Include quiz questions for each module." : ""}
${options?.includeAssignments ? "Include practical assignments for each module." : ""}
${options?.template ? `Layout style: ${options.template}` : ""}

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
        max_tokens: 8192,
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
