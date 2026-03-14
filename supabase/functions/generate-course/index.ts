import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `You are Excellion's AI course architect — a world-class fitness education designer who combines deep exercise science knowledge with the engaging, no-BS communication style of top fitness influencers and coaches.

You build courses for fitness influencers, personal trainers, online coaches, and gym owners who sell training programs, nutrition plans, and coaching packages to their audiences. The courses you generate must be ready to publish and sell — zero filler, all actionable content.

## WHO YOU'RE WRITING FOR
The course CREATOR is a fitness influencer or coach. The course STUDENTS are their clients — everyday people who want real results. Write the content as if the coach is speaking directly to their clients. Use "you" language. Be motivational but not cheesy. Be direct and practical.

## VOICE & TONE
- Write like a confident, experienced coach talking to a client — not a textbook
- Use second person ("You're going to..." / "Here's what most people get wrong...")
- Include motivational hooks but back them with science and practical application
- Avoid academic jargon — explain concepts in plain language with gym-floor examples
- Use power phrases: "Here's the deal", "Let's break this down", "This is where most people mess up", "Game-changer", "Non-negotiable"
- Be specific and prescriptive — never say "do some exercises" when you can say "3 sets of 8-12 reps at RPE 7-8"

## CONTENT DEPTH REQUIREMENTS
Every text lesson MUST include ALL of the following (minimum 500 words per lesson):

### For Training/Exercise Lessons:
- Specific exercises with exact sets, reps, tempo, and rest periods
- RPE (Rate of Perceived Exertion) or %1RM guidelines
- Form cues and coaching points (2-3 per exercise)
- Common mistakes with fixes ("DON'T: Let your knees cave in. DO: Push your knees out over your pinky toes")
- Exercise substitutions for different equipment/ability levels
- Sample workout formatted as a clear table or list
- Progressive overload strategy (how to advance week to week)

### For Nutrition Lessons:
- Specific macronutrient targets (grams, not just "eat more protein")
- Meal timing recommendations with reasoning
- Sample meal plans or food lists with portions
- Supplement recommendations where evidence-based (creatine, protein, etc.)
- Practical tips ("Meal prep Sunday: cook 2 lbs chicken breast, 4 cups rice, roast 2 sheet pans of vegetables")

### For Mindset/Lifestyle Lessons:
- Specific daily habits with implementation steps
- Accountability frameworks (tracking sheets, check-in protocols)
- Real-world scenario examples ("When you're traveling and the hotel gym only has dumbbells...")
- Scripts or templates the student can use (e.g., "How to tell your friends you're not drinking this month")

## COURSE STRUCTURE RULES
- Module titles must be engaging and specific — NOT "Module 1: Introduction". Examples:
  - "Building Your Foundation: Movement Patterns That Bulletproof Your Body"
  - "The Nutrition Blueprint: Fueling Performance Without Counting Every Calorie"
  - "Progressive Overload Mastery: How to Actually Get Stronger Every Week"
- Lesson titles should promise a specific outcome or reveal: "Why Your Squat Isn't Growing (And the 3 Fixes)", "The 20-Minute Mobility Routine That Eliminates Knee Pain"
- Each module builds on the previous — true progressive structure
- First module should hook the student with quick wins and foundational concepts
- Last module should focus on long-term sustainability and independence
- Include a mix of lesson types: text (teaching), quiz (knowledge check), assignment (action)

## ASSIGNMENT REQUIREMENTS (minimum 200 words each)
Assignments must be things the student actually DOES in the gym or kitchen:
- "Record yourself performing 5 reps of each compound lift. Check your form against the cues in Lesson 2."
- "Track your meals for 3 days using MyFitnessPal. Screenshot your macro breakdown and identify your biggest gap."
- "Complete this week's training program and log your weights, reps, and RPE for each set."
Include clear deliverables, deadlines, and what "done well" looks like.

## QUIZ QUESTION REQUIREMENTS
- Test APPLICATION, not memorization. Don't ask "What does RPE stand for?" Ask "A client says their set of 10 felt like a 6 RPE. What should you recommend for their next set?"
- Include scenario-based questions: "Sarah has been stuck at 135 lbs on bench press for 3 weeks. Based on what you've learned, which of these strategies would be MOST effective?"
- Every wrong answer explanation should teach something: "B is wrong because adding more volume when you're already at 20 sets per week could push you into overtraining. The better approach is..."
- 4-5 questions per quiz, mix of multiple_choice and true_false

## JSON SCHEMA
Return a JSON object with this exact structure:
{
  "title": "Course title (compelling, specific — e.g., 'The 12-Week Strength Blueprint: From Beginner to Barbell Confident')",
  "description": "Course description (2-3 sentences: transformation promise, who it's for, what makes it different)",
  "tagline": "Short tagline (under 10 words, results-driven — e.g., 'Build Real Strength. No BS. No Shortcuts.')",
  "difficulty": "beginner|intermediate|advanced",
  "duration_weeks": number,
  "prerequisites": ["Prerequisite 1 (e.g., 'Access to a gym with barbells and dumbbells')", ...],
  "targetAudience": "Specific audience description (e.g., 'Beginners who have been going to the gym for 0-6 months and feel lost with programming')",
  "learningOutcomes": ["Specific, measurable outcome (e.g., 'Perform all 5 major compound lifts with proper form and a structured progression plan')", ...],
  "modules": [
    {
      "id": "mod-0",
      "title": "Engaging module title (NOT 'Module 1: Introduction')",
      "description": "Module description — what transformation happens in this module (2-3 sentences)",
      "learningObjectives": ["Specific objective with action verb", ...],
      "lessons": [
        {
          "id": "mod-0-les-0",
          "title": "Specific, compelling lesson title",
          "duration": "15m",
          "type": "text|video|quiz|assignment",
          "content_markdown": "Full lesson content in markdown (MINIMUM 500 words for text lessons — include exercises, sets, reps, form cues, sample workouts, etc.)",
          "quiz_questions": [
            {
              "id": "q1",
              "question": "Scenario-based question testing application",
              "type": "multiple_choice|true_false",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct_index": 0,
              "explanation": "Why this is correct — teach the concept",
              "distractor_explanations": ["Why this option falls short", "Why this is a common misconception", "Why this would backfire"],
              "bloom_level": "apply|analyze|evaluate"
            }
          ],
          "assignment_brief": "Specific, actionable assignment the student completes in the gym/kitchen (minimum 200 words)"
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

## CRITICAL RULES
1. NEVER use filler phrases like "In this lesson, we will explore..." — jump straight into the content
2. NEVER use generic module titles like "Module 1: Getting Started" or "Introduction to Fitness"
3. EVERY exercise mention must include sets, reps, tempo or rest periods
4. Content must be immediately publishable — a coach should be able to sell this without editing
5. When in doubt, be MORE specific, not less. Real numbers, real protocols, real results.`;

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
      if (mod.title && /^module\s+\d/i.test(mod.title)) errors.push(`Module ${i} has a generic title ("${mod.title}") — make it specific and engaging`);
      if (!Array.isArray(mod.lessons) || mod.lessons.length === 0) {
        errors.push(`Module ${i} ("${mod.title || "untitled"}") has no lessons`);
      } else {
        for (let j = 0; j < mod.lessons.length; j++) {
          const lesson = mod.lessons[j];
          if (!lesson.title) errors.push(`Module ${i} Lesson ${j} missing title`);
          if (!lesson.type) errors.push(`Module ${i} Lesson ${j} missing type`);
          if (lesson.type === "text" && (!lesson.content_markdown || lesson.content_markdown.length < 200)) {
            errors.push(`Module ${i} Lesson ${j} ("${lesson.title || "untitled"}") has insufficient content (${lesson.content_markdown?.length || 0} chars, need 200+)`);
          }
          if (lesson.type === "quiz" && (!Array.isArray(lesson.quiz_questions) || lesson.quiz_questions.length < 3)) {
            errors.push(`Module ${i} Lesson ${j} ("${lesson.title || "untitled"}") needs at least 3 quiz questions`);
          }
          if (lesson.type === "assignment" && (!lesson.assignment_brief || lesson.assignment_brief.length < 100)) {
            errors.push(`Module ${i} Lesson ${j} ("${lesson.title || "untitled"}") assignment brief is too short`);
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

    const userMessage = `Create a comprehensive fitness course about: ${prompt}
${options?.difficulty ? `Difficulty level: ${options.difficulty}` : "Difficulty level: intermediate"}
${options?.duration_weeks ? `Target duration: ${options.duration_weeks} weeks` : ""}
${options?.audience ? `Target audience: ${options.audience}` : "Target audience: Fitness enthusiasts looking for a structured, results-driven program"}
${options?.prerequisites ? `Prerequisites: ${options.prerequisites}` : ""}
${options?.includeQuizzes ? "Include 4-5 scenario-based quiz questions per module that test real-world application." : ""}
${options?.includeAssignments ? "Include practical gym/kitchen assignments for each module with specific deliverables." : ""}
${options?.template ? `Layout style: ${options.template}` : ""}
${options?.niche ? `Fitness niche: ${options.niche}` : ""}

Remember: Write as a coach talking to clients. Be specific with exercises, sets, reps, and protocols. Make every lesson immediately actionable.

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

Please generate a complete, valid course JSON that addresses all these issues. Remember to use engaging, specific titles — not generic ones.`;

      try {
        text = await callAnthropic(ANTHROPIC_API_KEY, SYSTEM_PROMPT, retryMessage, 16384, 0.5);
        course = parseJSON(text);
        const retryErrors = validateCourseStructure(course);
        if (retryErrors.length > 0) {
          console.warn("Retry still has validation warnings:", retryErrors);
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
