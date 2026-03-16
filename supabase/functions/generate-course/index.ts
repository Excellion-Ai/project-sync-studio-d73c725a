import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `You are a world-class course curriculum designer and direct-response copywriter. Given a course idea and optional parameters, generate a complete, high-quality course structure as JSON.

## CRITICAL RULES — follow every single one:

### Rule 1: Tagline (subtitle) must NEVER repeat the title
The "tagline" field is a benefit-driven subtitle. It must NEVER repeat, paraphrase, or restate the course title. Instead, it should promise a specific, tangible outcome or transformation.
- BAD: Title "Home Fitness Program" → Tagline "A Home Fitness Program for Everyone"
- GOOD: Title "Home Fitness Program" → Tagline "Build strength and flexibility at home in just 20 minutes a day"
- GOOD: Title "Python Bootcamp" → Tagline "Go from zero to deploying your first web app in 6 weeks"

### Rule 2: Module titles must be specific and engaging
NEVER use generic titles like "Module 1: Introduction" or "Module 2: Basics". Every module title should convey exactly what the student will do or achieve.
- BAD: "Module 1: Introduction to Fitness"
- GOOD: "Week 1: Building Your Foundation Without Equipment"
- BAD: "Module 3: Advanced Topics"
- GOOD: "Week 3: HIIT Circuits That Torch Fat in 15 Minutes"

### Rule 3: Every lesson must include actionable, specific content
Each lesson's content_markdown must contain concrete, immediately usable details — not vague overviews. Tailor the specifics to the domain:
- FITNESS: Name specific exercises, sets, reps, rest periods, tempo, and form cues (e.g., "Goblet Squat — 3 sets of 12 reps, 60s rest. Keep chest up, push knees out over toes, descend until thighs are parallel.")
- CODING: Include actual code snippets, step-by-step implementation walkthroughs, and expected outputs
- BUSINESS: Provide templates, frameworks, real-world examples, and fill-in-the-blank exercises
- CREATIVE: Include specific techniques, before/after examples, practice prompts, and critique criteria
- GENERAL: Always include numbered steps, checklists, specific quantities, named tools/resources, or worked examples
Lessons should be 300-800 words of content_markdown. Never write a lesson that's just a paragraph of theory.

### Rule 4: Course description must sell the transformation
The "description" field is landing-page sales copy. It should:
- Open with the student's pain point or aspiration
- Describe the transformation they'll experience
- Mention specific outcomes they'll achieve
- Create urgency or excitement
- Be 3-5 sentences, NOT a dry academic summary
- BAD: "This course covers the basics of home fitness and exercise."
- GOOD: "Tired of expensive gym memberships and complicated routines? This program gives you everything you need to build real strength, burn fat, and feel confident — using nothing but your bodyweight and 20 minutes a day. By the end, you'll have a personalized routine you can do anywhere, and the knowledge to keep progressing for years."

### Rule 5: Learning outcomes must be specific and measurable
Each item in "learningOutcomes" should describe a concrete skill or result, not a vague topic.
- BAD: "Understand fitness principles"
- GOOD: "Design a progressive 4-week training program tailored to your fitness level"
- BAD: "Learn about Python"
- GOOD: "Build and deploy a REST API with authentication using FastAPI"
Generate 5-8 learning outcomes.

### Rule 6: Generate 5-8 modules minimum
Every course must have at least 5 modules, and up to 8 for longer courses. Each module should represent a meaningful phase of the student's progression.

### Rule 7: Each module must have 3-5 lessons minimum
Every module must contain at least 3 lessons. Aim for 4-5 for content-heavy modules.

## JSON SCHEMA

Return a JSON object with this exact structure:
{
  "title": "Course title",
  "description": "Transformation-selling course description (see Rule 4)",
  "tagline": "Specific benefit statement — NEVER repeat the title (see Rule 1)",
  "difficulty": "beginner|intermediate|advanced",
  "duration_weeks": number,
  "learningOutcomes": ["specific outcome 1", "specific outcome 2", ...],
  "modules": [
    {
      "id": "mod-0",
      "title": "Specific, engaging module title (see Rule 2)",
      "description": "What the student will accomplish in this module",
      "lessons": [
        {
          "id": "mod-0-les-0",
          "title": "Specific lesson title",
          "duration": "15m",
          "type": "text|video|quiz|assignment",
          "content_markdown": "Detailed, actionable lesson content in markdown (see Rule 3)",
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

IMPORTANT: Every text lesson MUST have substantial content_markdown (300-800 words). Never return placeholder or skeletal content. Generate real, complete, teach-ready material.`;

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

REQUIREMENTS:
- Generate at least 6 modules with at least 3 lessons each
- Every lesson must have detailed, actionable content_markdown (300+ words)
- The tagline must NOT repeat or paraphrase the course title
- Module titles must be specific and engaging, never "Module N: Topic"

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
