import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Model Selection Per Task ──────────────────────────────────
// Sonnet: best balance of reasoning + speed for structured generation
// Haiku: fast, used only for lightweight copy polish
const MODEL_STRUCTURE = "claude-sonnet-4-5-20250929"; // Strong reasoning for course architecture
const MODEL_CONTENT = "claude-sonnet-4-5-20250929";   // Creativity + accuracy for lesson writing
const MODEL_QUIZ = "claude-sonnet-4-5-20250929";       // Precision for assessment generation
const MODEL_POLISH = "claude-haiku-4-5-20251001";      // Fast creative pass for titles/copy

// ── Temperature Per Task ──────────────────────────────────────
// Lower = more deterministic/precise, Higher = more creative/varied
const TEMP_STRUCTURE = 0.4;  // Needs logical scaffolding, not wild creativity
const TEMP_CONTENT = 0.7;    // Needs creative writing with accurate fitness science
const TEMP_QUIZ = 0.3;       // Needs precise, unambiguous questions with correct answers
const TEMP_POLISH = 0.9;     // Maximum creativity for compelling titles and copy

// ── Max Tokens Per Task ───────────────────────────────────────
// Right-sized to avoid truncation while not wasting budget
const TOKENS_STRUCTURE = 4096;    // Outline only — no lesson content, fits easily
const TOKENS_CONTENT = 6144;     // Per-module: 2-4 lessons × 500+ words each
const TOKENS_QUIZ = 3072;        // Per-module: 4-5 questions with explanations
const TOKENS_POLISH = 2048;      // Just rewriting titles and descriptions

// ── Step 1 Prompt: Course Outline (structure only) ────────────
const OUTLINE_PROMPT = `You are Excellion's AI course architect — a world-class fitness education designer who builds courses for fitness influencers and online coaches.

Generate ONLY the course outline/structure — NO lesson content yet. Focus on logical progression, compelling titles, and clear learning objectives.

## STRUCTURE RULES
- Module titles must be engaging and specific — NEVER "Module 1: Introduction". Examples:
  - "Building Your Foundation: Movement Patterns That Bulletproof Your Body"
  - "The Nutrition Blueprint: Fueling Performance Without Counting Every Calorie"
- Lesson titles should promise a specific outcome: "Why Your Squat Isn't Growing (And the 3 Fixes)"
- Each module builds on the previous — true progressive structure
- First module: hook with quick wins and foundational concepts
- Last module: long-term sustainability and independence
- Mix lesson types: text (teaching), quiz (knowledge check), assignment (action)
- 3-5 lessons per module, 4-8 modules per course

## JSON SCHEMA (outline only — leave content_markdown as empty string)
{
  "title": "Compelling course title",
  "description": "2-3 sentences: transformation promise, who it's for, what's different",
  "tagline": "Under 10 words, results-driven",
  "difficulty": "beginner|intermediate|advanced",
  "duration_weeks": number,
  "prerequisites": ["Specific prerequisites"],
  "targetAudience": "Specific audience description",
  "learningOutcomes": ["Measurable outcomes with action verbs"],
  "modules": [
    {
      "id": "mod-0",
      "title": "Engaging module title",
      "description": "What transformation happens (2-3 sentences)",
      "learningObjectives": ["Specific objectives"],
      "lessons": [
        {
          "id": "mod-0-les-0",
          "title": "Specific, compelling lesson title",
          "duration": "15m",
          "type": "text|video|quiz|assignment",
          "content_markdown": "",
          "quiz_questions": [],
          "assignment_brief": ""
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
}`;

// ── Step 2 Prompt: Lesson Content (per module) ────────────────
const CONTENT_PROMPT = `You are a fitness coach writing detailed lesson content for an online course. Write as a coach talking directly to clients — motivational, direct, no-BS.

## VOICE
- Second person: "You're going to...", "Here's what most people get wrong..."
- Power phrases: "Here's the deal", "Game-changer", "Non-negotiable"
- Be specific and prescriptive — never "do some exercises" when you can say "3 sets of 8-12 reps at RPE 7-8"

## CONTENT REQUIREMENTS (minimum 500 words per text lesson)
For Training lessons: specific exercises with sets/reps/tempo/rest, RPE guidelines, form cues (2-3 per exercise), common mistakes with DO/DON'T format, exercise substitutions, sample workout, progressive overload strategy
For Nutrition lessons: specific macros in grams, meal timing, sample meal plans with portions, practical meal prep tips
For Mindset lessons: specific daily habits, accountability frameworks, real-world scenarios, templates/scripts

For assignment lessons: Write a detailed assignment_brief (200+ words) with specific gym/kitchen tasks, clear deliverables, and what "done well" looks like.

NEVER use filler like "In this lesson, we will explore..." — jump straight into teaching.

Return a JSON object with the module's lessons array, each lesson having its content_markdown filled in (and assignment_brief for assignment-type lessons). Keep all other fields (id, title, duration, type) exactly as provided.
{
  "lessons": [
    {
      "id": "existing-id",
      "title": "existing-title",
      "duration": "existing",
      "type": "existing",
      "content_markdown": "FULL lesson content here (500+ words for text lessons)",
      "quiz_questions": [],
      "assignment_brief": "Detailed assignment (200+ words for assignment lessons, empty string otherwise)"
    }
  ]
}`;

// ── Step 3 Prompt: Quiz Generation (per module) ───────────────
const QUIZ_PROMPT = `You are a fitness education assessment expert. Generate quiz questions that test REAL-WORLD APPLICATION — not memorization.

## QUIZ RULES
- Test APPLICATION: "A client says their set of 10 felt like a 6 RPE. What should you recommend?" NOT "What does RPE stand for?"
- Include scenarios: "Sarah has been stuck at 135 lbs bench for 3 weeks. Which strategy is MOST effective?"
- Every wrong answer explanation teaches something: "B is wrong because adding more volume at 20 sets/week risks overtraining..."
- 4-5 questions per quiz
- Mix multiple_choice and true_false
- Bloom's levels: mostly apply/analyze/evaluate (not remember)

Return a JSON object with quiz questions for each quiz lesson in this module:
{
  "quizzes": {
    "lesson-id": [
      {
        "id": "q1",
        "question": "Scenario-based question",
        "type": "multiple_choice|true_false",
        "options": ["A", "B", "C", "D"],
        "correct_index": 0,
        "explanation": "Why correct — teach the concept",
        "distractor_explanations": ["Why wrong", "Why wrong", "Why wrong"],
        "bloom_level": "apply|analyze|evaluate"
      }
    ]
  }
}`;

// ── Step 4 Prompt: Title & Copy Polish ────────────────────────
const POLISH_PROMPT = `You are a fitness marketing copywriter. Polish the course titles, descriptions, and tagline to be more compelling, specific, and sellable. The content should make a fitness influencer proud to put their name on it.

Rules:
- Titles should promise transformation or reveal secrets
- Descriptions should hook with a pain point, promise a result, and differentiate
- Tagline should be punchy, under 10 words, results-driven
- Module titles should be engaging — never "Module X: Topic"
- Keep the same structure, just improve the copy

Return JSON with only the polished fields:
{
  "title": "Polished title",
  "description": "Polished description",
  "tagline": "Polished tagline",
  "modules": [
    { "id": "mod-0", "title": "Polished module title", "description": "Polished module description" }
  ]
}`;

// ── API Call Helper ───────────────────────────────────────────

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  temperature: number,
) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        { role: "user", content: userMessage },
        { role: "assistant", content: "{" },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Anthropic API error:", response.status, errText);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return "{" + (data.content?.[0]?.text || "");
}

function parseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error("Failed to parse JSON from AI response");
  }
}

// ── SSE Helpers ───────────────────────────────────────────────

function sseEvent(encoder: TextEncoder, event: string, data: any) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ── Main Handler ──────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { prompt, options, stream } = await req.json();
    if (!prompt) throw new Error("prompt is required");

    const userContext = `Create a comprehensive fitness course about: ${prompt}
${options?.difficulty ? `Difficulty level: ${options.difficulty}` : "Difficulty level: intermediate"}
${options?.duration_weeks ? `Target duration: ${options.duration_weeks} weeks` : ""}
${options?.audience ? `Target audience: ${options.audience}` : "Target audience: Fitness enthusiasts looking for a structured, results-driven program"}
${options?.prerequisites ? `Prerequisites: ${options.prerequisites}` : ""}
${options?.niche ? `Fitness niche: ${options.niche}` : ""}`;

    // ── STREAMING MODE (SSE) ──────────────────────────────────
    if (stream) {
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // STEP 1: Generate outline
            controller.enqueue(sseEvent(encoder, "step", { step: "structure", status: "in_progress" }));

            const outlineText = await callAnthropic(
              ANTHROPIC_API_KEY, MODEL_STRUCTURE, OUTLINE_PROMPT,
              `${userContext}\n\nGenerate the course outline as JSON. Start with {`,
              TOKENS_STRUCTURE, TEMP_STRUCTURE,
            );
            const course = parseJSON(outlineText);

            controller.enqueue(sseEvent(encoder, "step", { step: "structure", status: "complete" }));
            controller.enqueue(sseEvent(encoder, "outline", course));

            // STEP 2: Generate lesson content — PARALLELIZED across modules
            controller.enqueue(sseEvent(encoder, "step", { step: "content", status: "in_progress" }));

            const contentPromises = course.modules.map((mod: any, i: number) => {
              const lessonsForContent = mod.lessons.filter((l: any) => l.type === "text" || l.type === "assignment");
              if (lessonsForContent.length === 0) return Promise.resolve(null);

              const moduleContext = `Course: "${course.title}"
Module ${i + 1}: "${mod.title}" — ${mod.description}
Module objectives: ${(mod.learningObjectives || []).join(", ")}
Difficulty: ${course.difficulty}

Here are the lessons to write content for:
${JSON.stringify(mod.lessons, null, 2)}

Write detailed content for each text and assignment lesson. Return JSON. Start with {`;

              return callAnthropic(
                ANTHROPIC_API_KEY, MODEL_CONTENT, CONTENT_PROMPT,
                moduleContext, TOKENS_CONTENT, TEMP_CONTENT,
              ).then(parseJSON).then((result: any) => ({ moduleIndex: i, lessons: result.lessons }));
            });

            const contentResults = await Promise.all(contentPromises);

            // Merge content back into course
            for (const result of contentResults) {
              if (!result) continue;
              const mod = course.modules[result.moduleIndex];
              for (const lessonContent of result.lessons) {
                const existing = mod.lessons.find((l: any) => l.id === lessonContent.id);
                if (existing) {
                  if (lessonContent.content_markdown) existing.content_markdown = lessonContent.content_markdown;
                  if (lessonContent.assignment_brief) existing.assignment_brief = lessonContent.assignment_brief;
                }
              }
            }

            controller.enqueue(sseEvent(encoder, "step", { step: "content", status: "complete" }));

            // STEP 3: Generate quizzes — PARALLELIZED across modules
            const modulesWithQuizzes = course.modules.filter(
              (mod: any) => mod.lessons.some((l: any) => l.type === "quiz")
            );

            if (modulesWithQuizzes.length > 0 || options?.includeQuizzes) {
              controller.enqueue(sseEvent(encoder, "step", { step: "quiz", status: "in_progress" }));

              const quizPromises = course.modules.map((mod: any, i: number) => {
                const quizLessons = mod.lessons.filter((l: any) => l.type === "quiz");
                if (quizLessons.length === 0) return Promise.resolve(null);

                const quizContext = `Course: "${course.title}"
Module: "${mod.title}" — ${mod.description}
Module content topics: ${mod.lessons.filter((l: any) => l.type === "text").map((l: any) => l.title).join(", ")}

Quiz lessons to generate questions for:
${JSON.stringify(quizLessons.map((l: any) => ({ id: l.id, title: l.title })), null, 2)}

Generate 4-5 scenario-based questions per quiz lesson. Return JSON. Start with {`;

                return callAnthropic(
                  ANTHROPIC_API_KEY, MODEL_QUIZ, QUIZ_PROMPT,
                  quizContext, TOKENS_QUIZ, TEMP_QUIZ,
                ).then(parseJSON).then((result: any) => ({ moduleIndex: i, quizzes: result.quizzes }));
              });

              const quizResults = await Promise.all(quizPromises);

              for (const result of quizResults) {
                if (!result || !result.quizzes) continue;
                const mod = course.modules[result.moduleIndex];
                for (const [lessonId, questions] of Object.entries(result.quizzes)) {
                  const lesson = mod.lessons.find((l: any) => l.id === lessonId);
                  if (lesson) lesson.quiz_questions = questions;
                }
              }

              controller.enqueue(sseEvent(encoder, "step", { step: "quiz", status: "complete" }));
            }

            // STEP 4: Polish titles and copy (fast, uses Haiku)
            controller.enqueue(sseEvent(encoder, "step", { step: "design", status: "in_progress" }));

            const polishContext = `Polish the copy for this fitness course:
Title: ${course.title}
Description: ${course.description}
Tagline: ${course.tagline}
Modules: ${JSON.stringify(course.modules.map((m: any) => ({ id: m.id, title: m.title, description: m.description })), null, 2)}

Return polished JSON. Start with {`;

            try {
              const polishText = await callAnthropic(
                ANTHROPIC_API_KEY, MODEL_POLISH, POLISH_PROMPT,
                polishContext, TOKENS_POLISH, TEMP_POLISH,
              );
              const polish = parseJSON(polishText);

              if (polish.title) course.title = polish.title;
              if (polish.description) course.description = polish.description;
              if (polish.tagline) course.tagline = polish.tagline;
              if (Array.isArray(polish.modules)) {
                for (const pm of polish.modules) {
                  const mod = course.modules.find((m: any) => m.id === pm.id);
                  if (mod) {
                    if (pm.title) mod.title = pm.title;
                    if (pm.description) mod.description = pm.description;
                  }
                }
              }
            } catch (polishErr) {
              console.warn("Polish step failed (non-critical):", polishErr);
              // Continue without polish — content is more important
            }

            controller.enqueue(sseEvent(encoder, "step", { step: "design", status: "complete" }));

            // Final result
            controller.enqueue(sseEvent(encoder, "complete", course));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            console.error("Stream generation error:", err);
            controller.enqueue(sseEvent(encoder, "error", {
              message: err instanceof Error ? err.message : "Generation failed",
            }));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    // ── NON-STREAMING MODE (backwards compatible) ─────────────
    // Runs the same pipeline but returns the final JSON directly

    // Step 1: Outline
    const outlineText = await callAnthropic(
      ANTHROPIC_API_KEY, MODEL_STRUCTURE, OUTLINE_PROMPT,
      `${userContext}\n\nGenerate the course outline as JSON. Start with {`,
      TOKENS_STRUCTURE, TEMP_STRUCTURE,
    );
    const course = parseJSON(outlineText);

    // Step 2: Lesson content — PARALLELIZED across modules
    const contentPromises = course.modules.map((mod: any, i: number) => {
      const lessonsForContent = mod.lessons.filter((l: any) => l.type === "text" || l.type === "assignment");
      if (lessonsForContent.length === 0) return Promise.resolve(null);

      return callAnthropic(
        ANTHROPIC_API_KEY, MODEL_CONTENT, CONTENT_PROMPT,
        `Course: "${course.title}"\nModule ${i + 1}: "${mod.title}" — ${mod.description}\nModule objectives: ${(mod.learningObjectives || []).join(", ")}\nDifficulty: ${course.difficulty}\n\nLessons:\n${JSON.stringify(mod.lessons, null, 2)}\n\nWrite detailed content. Return JSON. Start with {`,
        TOKENS_CONTENT, TEMP_CONTENT,
      ).then(parseJSON).then((result: any) => ({ moduleIndex: i, lessons: result.lessons }));
    });

    const contentResults = await Promise.all(contentPromises);
    for (const result of contentResults) {
      if (!result) continue;
      const mod = course.modules[result.moduleIndex];
      for (const lc of result.lessons) {
        const existing = mod.lessons.find((l: any) => l.id === lc.id);
        if (existing) {
          if (lc.content_markdown) existing.content_markdown = lc.content_markdown;
          if (lc.assignment_brief) existing.assignment_brief = lc.assignment_brief;
        }
      }
    }

    // Step 3: Quizzes — PARALLELIZED across modules
    const quizPromises = course.modules.map((mod: any, i: number) => {
      const quizLessons = mod.lessons.filter((l: any) => l.type === "quiz");
      if (quizLessons.length === 0) return Promise.resolve(null);

      return callAnthropic(
        ANTHROPIC_API_KEY, MODEL_QUIZ, QUIZ_PROMPT,
        `Course: "${course.title}"\nModule: "${mod.title}"\nContent topics: ${mod.lessons.filter((l: any) => l.type === "text").map((l: any) => l.title).join(", ")}\n\nQuiz lessons:\n${JSON.stringify(quizLessons.map((l: any) => ({ id: l.id, title: l.title })), null, 2)}\n\nGenerate 4-5 questions per quiz. Return JSON. Start with {`,
        TOKENS_QUIZ, TEMP_QUIZ,
      ).then(parseJSON).then((result: any) => ({ moduleIndex: i, quizzes: result.quizzes }));
    });

    const quizResults = await Promise.all(quizPromises);
    for (const result of quizResults) {
      if (!result || !result.quizzes) continue;
      const mod = course.modules[result.moduleIndex];
      for (const [lessonId, questions] of Object.entries(result.quizzes)) {
        const lesson = mod.lessons.find((l: any) => l.id === lessonId);
        if (lesson) lesson.quiz_questions = questions;
      }
    }

    // Step 4: Polish (fast, non-critical)
    try {
      const polishText = await callAnthropic(
        ANTHROPIC_API_KEY, MODEL_POLISH, POLISH_PROMPT,
        `Polish:\nTitle: ${course.title}\nDescription: ${course.description}\nTagline: ${course.tagline}\nModules: ${JSON.stringify(course.modules.map((m: any) => ({ id: m.id, title: m.title, description: m.description })))}\n\nReturn JSON. Start with {`,
        TOKENS_POLISH, TEMP_POLISH,
      );
      const polish = parseJSON(polishText);
      if (polish.title) course.title = polish.title;
      if (polish.description) course.description = polish.description;
      if (polish.tagline) course.tagline = polish.tagline;
      if (Array.isArray(polish.modules)) {
        for (const pm of polish.modules) {
          const mod = course.modules.find((m: any) => m.id === pm.id);
          if (mod) {
            if (pm.title) mod.title = pm.title;
            if (pm.description) mod.description = pm.description;
          }
        }
      }
    } catch {
      console.warn("Polish step failed (non-critical), continuing...");
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
