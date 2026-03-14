import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `You are an expert instructional designer and course curriculum architect with deep expertise in pedagogy, Bloom's taxonomy, and adult learning theory. Given a course idea and parameters, generate a comprehensive, high-quality course structure as JSON.

## Instructional Design Principles
- Every module should build on the previous one (scaffolded learning)
- Each lesson must have a clear, measurable learning objective
- Use the ADDIE model: Analyze audience → Design outcomes → Develop content → Implement activities → Evaluate with assessments
- Apply Bloom's taxonomy across the course: start with Remember/Understand, progress to Apply/Analyze, finish with Evaluate/Create

## Content Quality Requirements
- Module descriptions: 2-3 sentences explaining what the student will learn and why it matters
- Lesson content_markdown: MINIMUM 400 words for text lessons. Structure each lesson as:
  1. Learning objective statement ("By the end of this lesson, you will be able to...")
  2. Conceptual explanation with real-world analogies
  3. Worked example, case study, or step-by-step walkthrough
  4. Key takeaways (3-5 bullet points)
  5. Common mistakes or misconceptions to avoid
- Assignment briefs: minimum 150 words with clear deliverables, acceptance criteria, and a grading rubric
- Lesson durations must be realistic based on content length (text: ~200 words/minute reading speed)

## Quiz Question Guidelines
- Distribute across Bloom's levels: 40% Remember/Understand, 40% Apply/Analyze, 20% Evaluate/Create
- Every question MUST include a detailed explanation for the correct answer AND why each distractor is wrong
- Support these question types: multiple_choice, true_false, fill_blank
- Minimum 3 questions per quiz, ideally 5

## JSON Schema
Return a JSON object with this exact structure:
{
  "title": "Course title (compelling, specific, and keyword-rich)",
  "description": "Course description (2-3 sentences: what you'll learn, who it's for, what you'll be able to do)",
  "tagline": "Short tagline (under 10 words, benefit-driven)",
  "difficulty": "beginner|intermediate|advanced",
  "duration_weeks": number,
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "targetAudience": "Description of ideal student",
  "learningOutcomes": ["Specific, measurable outcome using action verbs (Bloom's)", ...],
  "modules": [
    {
      "id": "mod-0",
      "title": "Module title",
      "description": "Module description (2-3 sentences)",
      "learningObjectives": ["Module-level objective 1", ...],
      "lessons": [
        {
          "id": "mod-0-les-0",
          "title": "Lesson title",
          "duration": "15m",
          "type": "text|video|quiz|assignment",
          "content_markdown": "Full lesson content in markdown (minimum 400 words for text lessons)",
          "quiz_questions": [
            {
              "id": "q1",
              "question": "Question text",
              "type": "multiple_choice|true_false|fill_blank",
              "options": ["a", "b", "c", "d"],
              "correct_index": 0,
              "explanation": "Why this answer is correct",
              "distractor_explanations": ["Why A is wrong", "Why C is wrong", "Why D is wrong"],
              "bloom_level": "remember|understand|apply|analyze|evaluate|create"
            }
          ],
          "assignment_brief": "Detailed assignment description with deliverables and rubric (for assignment lessons)"
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

IMPORTANT: Generate genuinely detailed, substantive lesson content — not placeholder text. Each text lesson must read like a real textbook chapter section. Do not use filler phrases like "In this lesson we will learn about X." Instead, teach the actual material.`;

async function callAnthropic(
  apiKey: string,
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
      model: MODEL,
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
  const text = "{" + (data.content?.[0]?.text || "");
  return text;
}

function parseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse JSON from AI response");
  }
}

function validateCourseStructure(course: any): string[] {
  const errors: string[] = [];

  if (!course.title || typeof course.title !== "string") errors.push("Missing or invalid title");
  if (!course.description) errors.push("Missing description");
  if (!Array.isArray(course.learningOutcomes) || course.learningOutcomes.length === 0) errors.push("Missing learningOutcomes");
  if (!Array.isArray(course.modules) || course.modules.length === 0) errors.push("Missing modules");

  if (Array.isArray(course.modules)) {
    for (let i = 0; i < course.modules.length; i++) {
      const mod = course.modules[i];
      if (!mod.title) errors.push(`Module ${i} missing title`);
      if (!Array.isArray(mod.lessons) || mod.lessons.length === 0) {
        errors.push(`Module ${i} ("${mod.title || "untitled"}") has no lessons`);
      } else {
        for (let j = 0; j < mod.lessons.length; j++) {
          const lesson = mod.lessons[j];
          if (!lesson.title) errors.push(`Module ${i} Lesson ${j} missing title`);
          if (!lesson.type) errors.push(`Module ${i} Lesson ${j} missing type`);
          if (lesson.type === "text" && (!lesson.content_markdown || lesson.content_markdown.length < 100)) {
            errors.push(`Module ${i} Lesson ${j} ("${lesson.title || "untitled"}") has insufficient content (${lesson.content_markdown?.length || 0} chars, need 100+)`);
          }
          if (lesson.type === "quiz" && (!Array.isArray(lesson.quiz_questions) || lesson.quiz_questions.length === 0)) {
            errors.push(`Module ${i} Lesson ${j} ("${lesson.title || "untitled"}") is a quiz with no questions`);
          }
        }
      }
    }
  }

  return errors;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { prompt, options } = await req.json();
    if (!prompt) throw new Error("prompt is required");

    const userMessage = `Create a comprehensive course about: ${prompt}
${options?.difficulty ? `Difficulty level: ${options.difficulty}` : "Difficulty level: intermediate"}
${options?.duration_weeks ? `Target duration: ${options.duration_weeks} weeks` : ""}
${options?.audience ? `Target audience: ${options.audience}` : ""}
${options?.prerequisites ? `Prerequisites: ${options.prerequisites}` : ""}
${options?.includeQuizzes ? "Include 3-5 quiz questions for each module with detailed explanations and Bloom's taxonomy levels." : ""}
${options?.includeAssignments ? "Include practical, hands-on assignments for each module with clear deliverables and grading rubrics." : ""}
${options?.template ? `Layout style: ${options.template}` : ""}

Generate the complete course as a JSON object. Start with {`;

    // First attempt
    let text = await callAnthropic(ANTHROPIC_API_KEY, SYSTEM_PROMPT, userMessage, 16384, 0.7);
    let course;
    let validationErrors: string[] = [];

    try {
      course = parseJSON(text);
      validationErrors = validateCourseStructure(course);
    } catch {
      validationErrors = ["Failed to parse JSON"];
    }

    // Retry once with feedback if validation fails
    if (validationErrors.length > 0) {
      console.warn("First attempt validation errors:", validationErrors);
      const retryMessage = `${userMessage}

IMPORTANT: A previous generation attempt had these issues that you must fix:
${validationErrors.map((e) => `- ${e}`).join("\n")}

Please generate a complete, valid course JSON that addresses all these issues.`;

      try {
        text = await callAnthropic(ANTHROPIC_API_KEY, SYSTEM_PROMPT, retryMessage, 16384, 0.5);
        course = parseJSON(text);
        const retryErrors = validateCourseStructure(course);
        if (retryErrors.length > 0) {
          console.warn("Retry still has validation warnings:", retryErrors);
          // Continue with what we have — partial content is better than nothing
        }
      } catch (retryErr) {
        console.error("Retry also failed:", retryErr);
        if (!course) {
          throw new Error("Failed to generate valid course after retry");
        }
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
