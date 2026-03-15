import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Model & Parameter Config ──────────────────────────────────
const MODEL_STRUCTURE = "claude-sonnet-4-5-20250929";
const MODEL_CONTENT = "claude-sonnet-4-5-20250929";
const MODEL_QUIZ = "claude-sonnet-4-5-20250929";
const MODEL_POLISH = "claude-haiku-4-5-20251001";

const TEMP_STRUCTURE = 0.4;
const TEMP_CONTENT = 0.7;
const TEMP_QUIZ = 0.3;
const TEMP_POLISH = 0.9;

const TOKENS_STRUCTURE = 4096;
const TOKENS_QUIZ = 3072;
const TOKENS_POLISH = 2048;

const MAX_RETRIES = 2;

// Depth-based content token limits and word targets
const DEPTH_CONFIG: Record<string, { tokens: number; minWords: number; targetWords: number; lessonDuration: string }> = {
  overview: { tokens: 3072, minWords: 200, targetWords: 400, lessonDuration: "5m" },
  standard: { tokens: 6144, minWords: 500, targetWords: 800, lessonDuration: "15m" },
  deep_dive: { tokens: 8192, minWords: 1000, targetWords: 1500, lessonDuration: "30m" },
};

// Expertise-level prompt modifiers
const EXPERTISE_MODIFIERS: Record<string, string> = {
  beginner: `## EXPERTISE LEVEL: BEGINNER
- Use simple, encouraging language. Explain ALL terminology the first time it appears.
- Assume zero gym experience. Describe movement patterns from scratch.
- Provide bodyweight alternatives for every exercise.
- Focus on building habits and confidence, not performance metrics.
- RPE explanations: use simple scales like "light effort" / "moderate" / "challenging" instead of numbers.
- Nutrition: use hand-size portions instead of exact grams. Keep supplement talk minimal.
- Include "What this means for you" callouts to translate jargon into plain language.`,

  intermediate: `## EXPERTISE LEVEL: INTERMEDIATE
- Assume 6-12 months of training experience. Familiar with basic lifts and gym equipment.
- Use proper terminology (RPE, progressive overload, compound vs isolation) but briefly define advanced concepts.
- Include specific numbers: sets/reps/tempo/RPE ranges.
- Discuss training splits, periodization basics, and deload protocols.
- Nutrition: use macros in grams, discuss nutrient timing around workouts.
- Include "Level Up" callouts with advanced variations for faster progressors.`,

  advanced: `## EXPERTISE LEVEL: ADVANCED
- Assume 2+ years of consistent training. Fluent in training terminology.
- Use advanced programming concepts: undulating periodization, conjugate method, autoregulation, RPE/RIR, velocity-based training.
- Include precise loading percentages (% of 1RM), advanced tempo prescriptions (e.g., 4-0-1-0), cluster sets, mechanical drop sets.
- Nutrition: discuss periodized nutrition, carb cycling, peak week protocols, refeeds vs diet breaks.
- Recovery: HRV-guided training, sleep architecture optimization, targeted supplementation with dosing.
- Include research references and evidence-based rationale for programming choices.`,
};

// ═══════════════════════════════════════════════════════════════
// SECTION 1: STRICT SCHEMA VALIDATORS
// ═══════════════════════════════════════════════════════════════

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateOutline(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required top-level string fields
  if (!data || typeof data !== "object") { return { valid: false, errors: ["Response is not a JSON object"], warnings: [] }; }
  if (!data.title || typeof data.title !== "string" || data.title.length < 5) errors.push("title: missing or too short (need 5+ chars)");
  if (!data.description || typeof data.description !== "string" || data.description.length < 20) errors.push("description: missing or too short (need 20+ chars)");
  if (!data.tagline || typeof data.tagline !== "string") errors.push("tagline: missing");
  if (!["beginner", "intermediate", "advanced"].includes(data.difficulty)) errors.push(`difficulty: must be "beginner", "intermediate", or "advanced" — got "${data.difficulty}"`);
  if (typeof data.duration_weeks !== "number" || data.duration_weeks < 1) errors.push("duration_weeks: must be a positive number");

  // Learning outcomes
  if (!Array.isArray(data.learningOutcomes) || data.learningOutcomes.length < 2) {
    errors.push("learningOutcomes: must be an array with at least 2 items");
  } else {
    for (let i = 0; i < data.learningOutcomes.length; i++) {
      if (typeof data.learningOutcomes[i] !== "string" || data.learningOutcomes[i].length < 10) {
        warnings.push(`learningOutcomes[${i}]: too short or not a string`);
      }
    }
  }

  // Modules
  if (!Array.isArray(data.modules) || data.modules.length < 2) {
    errors.push("modules: must be an array with at least 2 modules");
  } else {
    for (let mi = 0; mi < data.modules.length; mi++) {
      const mod = data.modules[mi];
      if (!mod || typeof mod !== "object") { errors.push(`modules[${mi}]: not an object`); continue; }
      if (!mod.id || typeof mod.id !== "string") errors.push(`modules[${mi}].id: missing`);
      if (!mod.title || typeof mod.title !== "string" || mod.title.length < 5) errors.push(`modules[${mi}].title: missing or too short`);
      if (/^module\s+\d/i.test(mod.title || "")) errors.push(`modules[${mi}].title: "${mod.title}" is generic — use an engaging, specific title`);
      if (!mod.description || typeof mod.description !== "string") errors.push(`modules[${mi}].description: missing`);

      if (!Array.isArray(mod.lessons) || mod.lessons.length < 2) {
        errors.push(`modules[${mi}] ("${mod.title || "?"}"): must have at least 2 lessons`);
      } else {
        for (let li = 0; li < mod.lessons.length; li++) {
          const les = mod.lessons[li];
          if (!les || typeof les !== "object") { errors.push(`modules[${mi}].lessons[${li}]: not an object`); continue; }
          if (!les.id || typeof les.id !== "string") errors.push(`modules[${mi}].lessons[${li}].id: missing`);
          if (!les.title || typeof les.title !== "string" || les.title.length < 5) errors.push(`modules[${mi}].lessons[${li}].title: missing or too short`);
          if (!["text", "video", "quiz", "assignment"].includes(les.type)) errors.push(`modules[${mi}].lessons[${li}].type: must be text|video|quiz|assignment — got "${les.type}"`);
          if (!les.duration || typeof les.duration !== "string") warnings.push(`modules[${mi}].lessons[${li}].duration: missing`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateContent(data: any, expectedLessonIds: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== "object") { return { valid: false, errors: ["Response is not a JSON object"], warnings: [] }; }
  if (!Array.isArray(data.lessons)) { errors.push("lessons: must be an array"); return { valid: errors.length === 0, errors, warnings }; }

  const returnedIds = new Set(data.lessons.map((l: any) => l.id));
  for (const expectedId of expectedLessonIds) {
    if (!returnedIds.has(expectedId)) warnings.push(`Lesson "${expectedId}" was expected but not returned`);
  }

  for (let i = 0; i < data.lessons.length; i++) {
    const les = data.lessons[i];
    if (!les.id) errors.push(`lessons[${i}].id: missing`);
    if (!les.type) errors.push(`lessons[${i}].type: missing`);

    if (les.type === "text") {
      if (!les.content_markdown || typeof les.content_markdown !== "string") {
        errors.push(`lessons[${i}] ("${les.title || les.id}"): content_markdown is missing`);
      } else {
        const wordCount = les.content_markdown.split(/\s+/).filter(Boolean).length;
        if (wordCount < 100) errors.push(`lessons[${i}] ("${les.title || les.id}"): content too short (${wordCount} words, need 100+)`);
        else if (wordCount < 300) warnings.push(`lessons[${i}] ("${les.title || les.id}"): content is thin (${wordCount} words, target 500+)`);
      }
    }

    if (les.type === "assignment") {
      if (!les.assignment_brief || typeof les.assignment_brief !== "string") {
        errors.push(`lessons[${i}] ("${les.title || les.id}"): assignment_brief is missing`);
      } else {
        const wordCount = les.assignment_brief.split(/\s+/).filter(Boolean).length;
        if (wordCount < 50) errors.push(`lessons[${i}] ("${les.title || les.id}"): assignment_brief too short (${wordCount} words, need 50+)`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateQuizzes(data: any, expectedLessonIds: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== "object") { return { valid: false, errors: ["Response is not a JSON object"], warnings: [] }; }
  if (!data.quizzes || typeof data.quizzes !== "object") { errors.push("quizzes: must be an object keyed by lesson ID"); return { valid: false, errors, warnings }; }

  for (const expectedId of expectedLessonIds) {
    if (!data.quizzes[expectedId]) warnings.push(`Quiz for lesson "${expectedId}" was expected but not returned`);
  }

  for (const [lessonId, questions] of Object.entries(data.quizzes)) {
    if (!Array.isArray(questions)) { errors.push(`quizzes["${lessonId}"]: must be an array`); continue; }
    if ((questions as any[]).length < 3) errors.push(`quizzes["${lessonId}"]: need at least 3 questions, got ${(questions as any[]).length}`);

    for (let qi = 0; qi < (questions as any[]).length; qi++) {
      const q = (questions as any[])[qi];
      if (!q.question || typeof q.question !== "string" || q.question.length < 10) errors.push(`quizzes["${lessonId}"][${qi}].question: missing or too short`);
      if (!["multiple_choice", "true_false"].includes(q.type)) errors.push(`quizzes["${lessonId}"][${qi}].type: must be multiple_choice or true_false — got "${q.type}"`);
      if (q.type === "multiple_choice") {
        if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`quizzes["${lessonId}"][${qi}].options: need at least 2 options`);
        if (typeof q.correct_index !== "number" || q.correct_index < 0 || q.correct_index >= (q.options?.length || 0)) {
          errors.push(`quizzes["${lessonId}"][${qi}].correct_index: invalid (${q.correct_index}) for ${q.options?.length || 0} options`);
        }
      }
      if (!q.explanation || typeof q.explanation !== "string") warnings.push(`quizzes["${lessonId}"][${qi}].explanation: missing`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validatePolish(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== "object") { return { valid: false, errors: ["Response is not a JSON object"], warnings: [] }; }
  if (data.title && typeof data.title !== "string") errors.push("title: must be a string");
  if (data.description && typeof data.description !== "string") errors.push("description: must be a string");
  if (data.tagline && typeof data.tagline !== "string") errors.push("tagline: must be a string");
  if (data.modules && !Array.isArray(data.modules)) errors.push("modules: must be an array");

  return { valid: errors.length === 0, errors, warnings };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: FALLBACK CONTENT GENERATORS
// ═══════════════════════════════════════════════════════════════

function applyOutlineFallbacks(course: any, prompt: string): void {
  if (!course.title) course.title = prompt.slice(0, 60);
  if (!course.description) course.description = `A comprehensive course on ${prompt}. Build real skills with practical, hands-on lessons.`;
  if (!course.tagline) course.tagline = "Transform your results.";
  if (!course.difficulty) course.difficulty = "intermediate";
  if (!course.duration_weeks || typeof course.duration_weeks !== "number") course.duration_weeks = 6;
  if (!Array.isArray(course.prerequisites)) course.prerequisites = [];
  if (!course.targetAudience) course.targetAudience = "Fitness enthusiasts looking for a structured program";
  if (!Array.isArray(course.learningOutcomes) || course.learningOutcomes.length === 0) {
    course.learningOutcomes = ["Master the core techniques covered in this program", "Build a sustainable plan you can follow independently"];
  }
  if (!course.design_config) {
    course.design_config = {
      colors: { primary: "#d4a853", secondary: "#1a1a1a", accent: "#f59e0b", background: "#0a0a0a", cardBackground: "#111111", text: "#ffffff", textMuted: "#9ca3af" },
      fonts: { heading: "Inter", body: "Inter" }, spacing: "normal", borderRadius: "medium", heroStyle: "gradient",
    };
  }
  if (!course.pages) course.pages = { landing_sections: ["hero", "outcomes", "curriculum", "instructor", "faq"] };

  // Module-level fallbacks
  if (Array.isArray(course.modules)) {
    for (let i = 0; i < course.modules.length; i++) {
      const mod = course.modules[i];
      if (!mod.id) mod.id = `mod-${i}`;
      if (!mod.title) mod.title = `Module ${i + 1}`;
      if (!mod.description) mod.description = `Core content for phase ${i + 1} of the program.`;
      if (!Array.isArray(mod.learningObjectives)) mod.learningObjectives = [];
      if (!Array.isArray(mod.lessons)) mod.lessons = [];

      for (let j = 0; j < mod.lessons.length; j++) {
        const les = mod.lessons[j];
        if (!les.id) les.id = `${mod.id}-les-${j}`;
        if (!les.title) les.title = `Lesson ${j + 1}`;
        if (!les.duration) les.duration = "15m";
        if (!les.type) les.type = "text";
        if (les.content_markdown === undefined) les.content_markdown = "";
        if (!Array.isArray(les.quiz_questions)) les.quiz_questions = [];
        if (les.assignment_brief === undefined) les.assignment_brief = "";
      }
    }
  }
}

function applyContentFallbacks(mod: any): void {
  if (!Array.isArray(mod.lessons)) return;
  for (const les of mod.lessons) {
    if (les.type === "text" && (!les.content_markdown || les.content_markdown.trim().length < 50)) {
      les.content_markdown = `## ${les.title}\n\nThis lesson covers the key concepts of ${les.title.toLowerCase()}. Content is being refined — check back soon for the full detailed breakdown with exercises, sets, reps, and coaching cues.\n\n**Key points to cover:**\n- Core technique and form\n- Common mistakes and how to fix them\n- How to progress over time\n\n*This content was auto-generated as a placeholder. Use the Refine tab to regenerate with full detail.*`;
    }
    if (les.type === "assignment" && (!les.assignment_brief || les.assignment_brief.trim().length < 20)) {
      les.assignment_brief = `Complete the practical exercises from ${les.title}. Document your results including weights used, reps completed, and any form notes. Submit a brief summary of what you learned and what you found challenging.\n\n*This assignment brief was auto-generated as a placeholder. Use the Refine tab to add specific deliverables.*`;
    }
  }
}

function applyQuizFallbacks(lesson: any): void {
  if (lesson.type === "quiz" && (!Array.isArray(lesson.quiz_questions) || lesson.quiz_questions.length === 0)) {
    lesson.quiz_questions = [
      {
        id: "q1-fallback",
        question: `Based on what you learned in this module, which approach would be most effective for a beginner?`,
        type: "multiple_choice",
        options: [
          "Start with lighter weights and focus on form before adding load",
          "Immediately train to failure on every set",
          "Only do cardio for the first month",
          "Skip warmups to save time",
        ],
        correct_index: 0,
        explanation: "Building proper movement patterns with manageable loads is the foundation of long-term progress. This reduces injury risk and builds the motor patterns needed for heavier training later.",
        distractor_explanations: [
          "Training to failure too early increases injury risk and doesn't build proper form habits.",
          "While cardio has its place, resistance training is essential from the start for the goals in this course.",
          "Warmups are non-negotiable for injury prevention and performance — never skip them.",
        ],
        bloom_level: "apply",
      },
    ];
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: QUALITY METRICS
// ═══════════════════════════════════════════════════════════════

interface QualityMetrics {
  totalModules: number;
  totalLessons: number;
  lessonsByType: Record<string, number>;
  wordCountPerLesson: Array<{ id: string; title: string; type: string; wordCount: number }>;
  avgWordsPerTextLesson: number;
  minWordsTextLesson: number;
  maxWordsTextLesson: number;
  totalQuizQuestions: number;
  quizQuestionsPerModule: Record<string, number>;
  assignmentCount: number;
  avgAssignmentWords: number;
  emptyContentLessons: string[];
  emptyQuizLessons: string[];
  emptyAssignmentLessons: string[];
  generationSteps: Array<{ step: string; durationMs: number; retries: number; status: string }>;
  totalDurationMs: number;
}

function computeMetrics(course: any, stepTimings: Array<{ step: string; durationMs: number; retries: number; status: string }>): QualityMetrics {
  const metrics: QualityMetrics = {
    totalModules: 0,
    totalLessons: 0,
    lessonsByType: {},
    wordCountPerLesson: [],
    avgWordsPerTextLesson: 0,
    minWordsTextLesson: Infinity,
    maxWordsTextLesson: 0,
    totalQuizQuestions: 0,
    quizQuestionsPerModule: {},
    assignmentCount: 0,
    avgAssignmentWords: 0,
    emptyContentLessons: [],
    emptyQuizLessons: [],
    emptyAssignmentLessons: [],
    generationSteps: stepTimings,
    totalDurationMs: stepTimings.reduce((sum, s) => sum + s.durationMs, 0),
  };

  if (!Array.isArray(course.modules)) return metrics;
  metrics.totalModules = course.modules.length;

  let textWordCounts: number[] = [];
  let assignmentWordCounts: number[] = [];

  for (const mod of course.modules) {
    if (!Array.isArray(mod.lessons)) continue;
    let moduleQuizCount = 0;

    for (const les of mod.lessons) {
      metrics.totalLessons++;
      metrics.lessonsByType[les.type] = (metrics.lessonsByType[les.type] || 0) + 1;

      const contentWords = (les.content_markdown || "").split(/\s+/).filter(Boolean).length;
      metrics.wordCountPerLesson.push({ id: les.id, title: les.title, type: les.type, wordCount: contentWords });

      if (les.type === "text") {
        textWordCounts.push(contentWords);
        if (contentWords < 50) metrics.emptyContentLessons.push(`${les.id} ("${les.title}")`);
      }

      if (les.type === "quiz") {
        const qCount = Array.isArray(les.quiz_questions) ? les.quiz_questions.length : 0;
        metrics.totalQuizQuestions += qCount;
        moduleQuizCount += qCount;
        if (qCount === 0) metrics.emptyQuizLessons.push(`${les.id} ("${les.title}")`);
      }

      if (les.type === "assignment") {
        metrics.assignmentCount++;
        const briefWords = (les.assignment_brief || "").split(/\s+/).filter(Boolean).length;
        assignmentWordCounts.push(briefWords);
        if (briefWords < 20) metrics.emptyAssignmentLessons.push(`${les.id} ("${les.title}")`);
      }
    }

    metrics.quizQuestionsPerModule[mod.id] = moduleQuizCount;
  }

  if (textWordCounts.length > 0) {
    metrics.avgWordsPerTextLesson = Math.round(textWordCounts.reduce((a, b) => a + b, 0) / textWordCounts.length);
    metrics.minWordsTextLesson = Math.min(...textWordCounts);
    metrics.maxWordsTextLesson = Math.max(...textWordCounts);
  } else {
    metrics.minWordsTextLesson = 0;
  }

  if (assignmentWordCounts.length > 0) {
    metrics.avgAssignmentWords = Math.round(assignmentWordCounts.reduce((a, b) => a + b, 0) / assignmentWordCounts.length);
  }

  return metrics;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: API CALL WITH RETRY
// ═══════════════════════════════════════════════════════════════

async function callAnthropic(apiKey: string, model: string, systemPrompt: string, userMessage: string, maxTokens: number, temperature: number) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model, max_tokens: maxTokens, temperature, system: systemPrompt,
      messages: [{ role: "user", content: userMessage }, { role: "assistant", content: "{" }],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error("Anthropic API error:", response.status, errText);
    throw new Error(`Anthropic API error: ${response.status} — ${errText.slice(0, 200)}`);
  }
  const data = await response.json();
  return "{" + (data.content?.[0]?.text || "");
}

function parseJSON(text: string): any {
  try { return JSON.parse(text); }
  catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(`JSON parse failed. Response starts with: "${text.slice(0, 100)}..."`);
  }
}

/** Call Anthropic, parse JSON, validate against schema, retry up to MAX_RETRIES times on failure */
async function callWithValidation(
  apiKey: string, model: string, systemPrompt: string, userMessage: string,
  maxTokens: number, temperature: number,
  validator: (data: any) => ValidationResult,
  stepName: string,
): Promise<{ data: any; retries: number; warnings: string[] }> {
  let lastErrors: string[] = [];
  let allWarnings: string[] = [];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let messageToSend = userMessage;

    // On retry, append the validation errors so the model can correct itself
    if (attempt > 0 && lastErrors.length > 0) {
      messageToSend = `${userMessage}

CRITICAL: Your previous response (attempt ${attempt} of ${MAX_RETRIES + 1}) had these validation errors that you MUST fix:
${lastErrors.map((e) => `- ${e}`).join("\n")}

Fix ALL errors listed above. Return corrected JSON. Start with {`;
      // Drop temperature slightly on retries for more deterministic output
      temperature = Math.max(0.1, temperature - 0.15);
    }

    try {
      const text = await callAnthropic(apiKey, model, systemPrompt, messageToSend, maxTokens, temperature);
      const data = parseJSON(text);
      const result = validator(data);
      allWarnings.push(...result.warnings);

      if (result.valid) {
        if (attempt > 0) console.log(`[${stepName}] Validation passed on retry ${attempt}`);
        return { data, retries: attempt, warnings: allWarnings };
      }

      lastErrors = result.errors;
      console.warn(`[${stepName}] Validation failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, result.errors);
    } catch (err) {
      lastErrors = [err instanceof Error ? err.message : "Unknown parse/API error"];
      console.error(`[${stepName}] Exception (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, err);
    }
  }

  // All retries exhausted — throw with specific details
  throw new Error(`[${stepName}] Failed after ${MAX_RETRIES + 1} attempts. Last errors: ${lastErrors.join("; ")}`);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5: PROMPTS
// ═══════════════════════════════════════════════════════════════

function buildOutlinePrompt(options: any): string {
  const depth = options?.depth || "standard";
  const depthCfg = DEPTH_CONFIG[depth] || DEPTH_CONFIG.standard;
  const expertise = options?.difficulty || "intermediate";
  const nicheContext = options?.niche ? `\nFitness niche focus: ${options.niche}. Tailor ALL examples, exercises, and terminology to this niche.` : "";
  const audienceContext = options?.audience ? `\nTarget audience: ${options.audience}. Write titles and descriptions that speak directly to this audience's goals, frustrations, and language.` : "";

  return `You are Excellion's AI course architect — a world-class fitness education designer who builds courses for fitness influencers and online coaches.
${nicheContext}${audienceContext}

Generate ONLY the course outline/structure — NO lesson content yet. Focus on logical progression, compelling titles, and clear learning objectives.

${EXPERTISE_MODIFIERS[expertise] || EXPERTISE_MODIFIERS.intermediate}

## DEPTH LEVEL: ${depth.toUpperCase()}
- Target lesson duration: ${depthCfg.lessonDuration}
${depth === "overview" ? "- Keep modules concise: 2-3 lessons per module, 3-5 modules total. Quick-start format." : ""}
${depth === "standard" ? "- Standard depth: 3-5 lessons per module, 4-8 modules per course." : ""}
${depth === "deep_dive" ? "- Maximum depth: 5-7 lessons per module, 6-10 modules per course. Include deep technical breakdowns, case studies, and advanced programming." : ""}

## STRUCTURE RULES
- Module titles must be engaging and specific — NEVER "Module 1: Introduction". Examples:
  - "Building Your Foundation: Movement Patterns That Bulletproof Your Body"
  - "The Nutrition Blueprint: Fueling Performance Without Counting Every Calorie"
- Lesson titles should promise a specific outcome: "Why Your Squat Isn't Growing (And the 3 Fixes)"
- Each module builds on the previous — true progressive structure
- First module: hook with quick wins and foundational concepts
- Last module: long-term sustainability and independence
- Mix lesson types: text (teaching), quiz (knowledge check), assignment (action)
- Every lesson MUST have: id (string), title (string, 5+ chars), duration (string like "${depthCfg.lessonDuration}"), type (one of: text, video, quiz, assignment)
- Every module MUST have: id (string), title (string, 5+ chars), description (string), learningObjectives (string array), lessons (array with 2+ lessons)

## JSON SCHEMA (outline only — set content_markdown to empty string "", quiz_questions to [], assignment_brief to "")
{
  "title": "Compelling course title (string, 5+ chars)",
  "description": "2-3 sentences (string, 20+ chars)",
  "tagline": "Under 10 words (string)",
  "difficulty": "beginner|intermediate|advanced",
  "duration_weeks": number (positive integer),
  "prerequisites": ["string array"],
  "targetAudience": "string",
  "learningOutcomes": ["At least 2 measurable outcomes"],
  "modules": [{ "id": "mod-0", "title": "...", "description": "...", "learningObjectives": ["..."], "lessons": [{ "id": "mod-0-les-0", "title": "...", "duration": "${depthCfg.lessonDuration}", "type": "text", "content_markdown": "", "quiz_questions": [], "assignment_brief": "" }] }],
  "design_config": { "colors": {"primary":"#d4a853","secondary":"#1a1a1a","accent":"#f59e0b","background":"#0a0a0a","cardBackground":"#111111","text":"#ffffff","textMuted":"#9ca3af"}, "fonts": {"heading":"Inter","body":"Inter"}, "spacing": "normal", "borderRadius": "medium", "heroStyle": "gradient" },
  "pages": { "landing_sections": ["hero","outcomes","curriculum","instructor","faq"] }
}`;
}

function buildContentPrompt(options: any): string {
  const depth = options?.depth || "standard";
  const depthCfg = DEPTH_CONFIG[depth] || DEPTH_CONFIG.standard;
  const expertise = options?.difficulty || "intermediate";
  const nicheContext = options?.niche ? `\nFitness niche: ${options.niche}. Use niche-specific exercises, terminology, and examples throughout.` : "";
  const audienceContext = options?.audience ? `\nTarget audience: ${options.audience}. Write as if speaking directly to this person — use their language, reference their daily challenges.` : "";

  return `You are a fitness coach writing detailed lesson content for an online course. Write as a coach talking directly to clients — motivational, direct, no-BS.
${nicheContext}${audienceContext}

${EXPERTISE_MODIFIERS[expertise] || EXPERTISE_MODIFIERS.intermediate}

## VOICE
- Second person: "You're going to...", "Here's what most people get wrong..."
- Power phrases: "Here's the deal", "Game-changer", "Non-negotiable"
- Be specific: "3 sets of 8-12 reps at RPE 7-8", not "do some exercises"

## CONTENT DEPTH: ${depth.toUpperCase()} (minimum ${depthCfg.minWords} words, target ${depthCfg.targetWords} words per text lesson)
${depth === "overview" ? "- Concise and actionable. Key takeaways, quick exercises, and main points only." : ""}
${depth === "standard" ? "- Thorough coverage with practical examples, sample workouts, and clear progressions." : ""}
${depth === "deep_dive" ? "- Exhaustive detail. Include research rationale, advanced programming variables, multiple workout variations, troubleshooting guides, and periodization strategies." : ""}

## CONTENT REQUIREMENTS
For Training lessons: exercises with sets/reps/tempo/rest, RPE guidelines, form cues, common mistakes, exercise substitutions, sample workout, progressive overload strategy
For Nutrition lessons: specific macros in grams, meal timing, sample meal plans with portions, meal prep tips
For Mindset lessons: specific daily habits, accountability frameworks, real-world scenarios
For assignment lessons: Write assignment_brief (200+ words) with specific gym/kitchen tasks, deliverables, and rubric

NEVER use filler like "In this lesson, we will explore..." — jump straight into teaching.

## STRUCTURED FITNESS FIELDS
In addition to content_markdown, include these structured fields when relevant to the lesson topic:

- "exercise_demos": Array of exercises with { name, muscle_groups[], equipment, sets, reps, tempo, rest, rpe, form_cues[], common_mistakes[], substitutions[] }
- "workout_template": { name, type (strength|hypertrophy|endurance|hiit|mobility|deload), warmup, exercises[], cooldown, total_duration, notes }
- "nutrition_guidelines": { context, calories, protein_g, carbs_g, fat_g, meal_timing[], sample_meals[{meal, description}], supplements[], hydration }
- "progress_metrics": [{ metric, how_to_measure, frequency, target }]
- "recovery_protocol": [{ type (sleep|active_recovery|stretching|foam_rolling|deload|other), description, frequency, duration }]

Only include fields that are relevant to the lesson topic. Training lessons should have exercise_demos and workout_template. Nutrition lessons should have nutrition_guidelines. All lessons can include progress_metrics and recovery_protocol where relevant.

## CRITICAL: Return EXACTLY this JSON structure:
{
  "lessons": [
    {
      "id": "keep-original-id",
      "title": "keep-original-title",
      "duration": "keep-original",
      "type": "keep-original",
      "content_markdown": "FULL content (${depthCfg.minWords}+ words for text type)",
      "quiz_questions": [],
      "assignment_brief": "200+ words for assignment type, empty string otherwise",
      "exercise_demos": [],
      "workout_template": null,
      "nutrition_guidelines": null,
      "progress_metrics": [],
      "recovery_protocol": []
    }
  ]
}
Return ALL lessons from the input, not just text/assignment ones. Keep quiz and video lessons with their original empty content.`;
}

function buildQuizPrompt(options: any): string {
  const expertise = options?.difficulty || "intermediate";
  const nicheContext = options?.niche ? `\nFitness niche: ${options.niche}. Use niche-specific scenarios (e.g., if powerlifting, use scenarios about squat/bench/deadlift programming).` : "";
  const audienceContext = options?.audience ? `\nTarget audience: ${options.audience}. Frame scenarios around this audience's real situations.` : "";

  return `You are a fitness education assessment expert. Generate quiz questions that test REAL-WORLD APPLICATION — not memorization.
${nicheContext}${audienceContext}

${expertise === "beginner" ? "Use simple, clear scenarios. Avoid advanced jargon. Test understanding of basic concepts and safe practices." : ""}
${expertise === "intermediate" ? "Use practical gym/nutrition scenarios. Test ability to apply training principles to real situations." : ""}
${expertise === "advanced" ? "Use complex programming scenarios. Test ability to analyze training variables, troubleshoot plateaus, and design periodized programs." : ""}

## QUIZ RULES
- Test APPLICATION: "A client says their set of 10 felt like a 6 RPE. What should you recommend?" NOT "What does RPE stand for?"
- Scenarios: "Sarah's been stuck at 135 lbs bench for 3 weeks. Which strategy is MOST effective?"
- Every wrong answer explanation teaches something
- 4-5 questions per quiz lesson
- Mix multiple_choice and true_false
- Bloom's levels: mostly apply/analyze/evaluate

## CRITICAL: Return EXACTLY this JSON structure:
{
  "quizzes": {
    "lesson-id-here": [
      {
        "id": "q1",
        "question": "Scenario-based question (10+ chars)",
        "type": "multiple_choice",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_index": 0,
        "explanation": "Why this is correct",
        "distractor_explanations": ["Why A wrong", "Why C wrong", "Why D wrong"],
        "bloom_level": "apply"
      }
    ]
  }
}
- Each quiz lesson must have at least 3 questions
- correct_index must be a valid index into the options array (0-based)
- For true_false type, options should be ["True", "False"] and correct_index 0 or 1`;
}

function buildPolishPrompt(options: any): string {
  const nicheContext = options?.niche ? ` in the ${options.niche} space` : "";
  const audienceContext = options?.audience ? ` targeting ${options.audience}` : "";

  return `You are a fitness marketing copywriter. Polish course titles, descriptions, and tagline to be compelling and sellable for a fitness course${nicheContext}${audienceContext}.

Rules:
- Titles: promise transformation or reveal secrets
- Descriptions: hook with pain point, promise result, differentiate
- Tagline: punchy, under 10 words, results-driven
- Module titles: engaging — never "Module X: Topic"

Return ONLY this JSON:
{ "title": "string", "description": "string", "tagline": "string", "modules": [{ "id": "mod-0", "title": "string", "description": "string" }] }`;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 6: SSE HELPERS
// ═══════════════════════════════════════════════════════════════

function sseEvent(encoder: TextEncoder, event: string, data: any) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 7: PIPELINE RUNNER
// ═══════════════════════════════════════════════════════════════

async function runPipeline(
  apiKey: string,
  prompt: string,
  options: any,
  onEvent?: (event: string, data: any) => void,
): Promise<{ course: any; metrics: QualityMetrics; outlineOnly?: boolean }> {
  const emit = onEvent || (() => {});
  const stepTimings: Array<{ step: string; durationMs: number; retries: number; status: string }> = [];
  const depth = options?.depth || "standard";
  const depthCfg = DEPTH_CONFIG[depth] || DEPTH_CONFIG.standard;

  const userContext = `Create a comprehensive fitness course about: ${prompt}
${options?.difficulty ? `Difficulty level: ${options.difficulty}` : "Difficulty level: intermediate"}
${options?.depth ? `Content depth: ${options.depth}` : "Content depth: standard"}
${options?.duration_weeks ? `Target duration: ${options.duration_weeks} weeks` : ""}
${options?.audience ? `Target audience: ${options.audience}` : "Target audience: Fitness enthusiasts looking for a structured, results-driven program"}
${options?.prerequisites ? `Prerequisites: ${options.prerequisites}` : ""}
${options?.niche ? `Fitness niche: ${options.niche}` : ""}`;

  let course: any;

  // ── STEP 1: OUTLINE (skip if approvedOutline provided) ──────
  if (options?.approvedOutline) {
    // Phase 2: user already approved the outline
    course = options.approvedOutline;
    stepTimings.push({ step: "structure", durationMs: 0, retries: 0, status: "skipped_approved" });
    emit("step", { step: "structure", status: "complete" });
    emit("outline", course);
  } else {
    emit("step", { step: "structure", status: "in_progress" });
    const step1Start = Date.now();
    let step1Retries = 0;

    try {
      const result = await callWithValidation(
        apiKey, MODEL_STRUCTURE, buildOutlinePrompt(options),
        `${userContext}\n\nGenerate the course outline as JSON. Start with {`,
        TOKENS_STRUCTURE, TEMP_STRUCTURE,
        validateOutline, "outline",
      );
      course = result.data;
      step1Retries = result.retries;
      if (result.warnings.length > 0) console.warn("[outline] Warnings:", result.warnings);
    } catch (err) {
      stepTimings.push({ step: "structure", durationMs: Date.now() - step1Start, retries: MAX_RETRIES, status: "failed" });
      emit("step", { step: "structure", status: "error" });
      const msg = err instanceof Error ? err.message : "Course outline generation failed";
      emit("error", { message: `Could not generate course structure: ${msg}. Try rephrasing your course idea or simplifying the topic.`, step: "structure", details: msg });
      throw err;
    }

    applyOutlineFallbacks(course, prompt);
    stepTimings.push({ step: "structure", durationMs: Date.now() - step1Start, retries: step1Retries, status: "ok" });
    emit("step", { step: "structure", status: "complete" });

    // If no approvedOutline and outline_only mode, return outline for user approval
    if (options?.outlineOnly) {
      emit("outline_ready", course);
      return { course, metrics: computeMetrics(course, stepTimings), outlineOnly: true };
    }

    emit("outline", course);
  }

  // ── STEP 2: LESSON CONTENT (parallel per module) ────────────
  emit("step", { step: "content", status: "in_progress" });
  const step2Start = Date.now();
  let step2Retries = 0;
  let contentErrors: string[] = [];

  const contentPromises = course.modules.map(async (mod: any, i: number) => {
    const contentLessons = mod.lessons.filter((l: any) => l.type === "text" || l.type === "assignment");
    if (contentLessons.length === 0) return { moduleIndex: i, skipped: true };

    const expectedIds = contentLessons.map((l: any) => l.id);
    const moduleContext = `Course: "${course.title}"
Module ${i + 1} of ${course.modules.length}: "${mod.title}" — ${mod.description}
Module objectives: ${(mod.learningObjectives || []).join(", ")}
Difficulty: ${course.difficulty}
Content depth: ${depth} (target ${depthCfg.targetWords} words per lesson, minimum ${depthCfg.minWords})
${options?.niche ? `Fitness niche: ${options.niche}` : ""}
${options?.audience ? `Target audience: ${options.audience}` : ""}

Here are ALL the lessons in this module (write content for text and assignment types, pass through others unchanged):
${JSON.stringify(mod.lessons, null, 2)}

Return JSON with ALL lessons. Start with {`;

    try {
      const result = await callWithValidation(
        apiKey, MODEL_CONTENT, buildContentPrompt(options),
        moduleContext, depthCfg.tokens, TEMP_CONTENT,
        (data) => validateContent(data, expectedIds),
        `content-mod-${i}`,
      );
      step2Retries += result.retries;
      return { moduleIndex: i, lessons: result.data.lessons, skipped: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Content generation failed";
      contentErrors.push(`Module "${mod.title}": ${msg}`);
      console.error(`[content-mod-${i}] Failed:`, err);
      return { moduleIndex: i, failed: true, skipped: false };
    }
  });

  const contentResults = await Promise.all(contentPromises);

  for (const result of contentResults) {
    if (!result || result.skipped || result.failed) continue;
    const mod = course.modules[result.moduleIndex];
    for (const lessonContent of result.lessons) {
      const existing = mod.lessons.find((l: any) => l.id === lessonContent.id);
      if (existing) {
        if (lessonContent.content_markdown) existing.content_markdown = lessonContent.content_markdown;
        if (lessonContent.assignment_brief) existing.assignment_brief = lessonContent.assignment_brief;
        // Merge structured fitness fields
        if (Array.isArray(lessonContent.exercise_demos) && lessonContent.exercise_demos.length > 0) existing.exercise_demos = lessonContent.exercise_demos;
        if (lessonContent.workout_template) existing.workout_template = lessonContent.workout_template;
        if (lessonContent.nutrition_guidelines) existing.nutrition_guidelines = lessonContent.nutrition_guidelines;
        if (Array.isArray(lessonContent.progress_metrics) && lessonContent.progress_metrics.length > 0) existing.progress_metrics = lessonContent.progress_metrics;
        if (Array.isArray(lessonContent.recovery_protocol) && lessonContent.recovery_protocol.length > 0) existing.recovery_protocol = lessonContent.recovery_protocol;
      }
    }
  }

  // Apply fallbacks for any modules that failed
  for (const mod of course.modules) {
    applyContentFallbacks(mod);
  }

  stepTimings.push({ step: "content", durationMs: Date.now() - step2Start, retries: step2Retries, status: contentErrors.length > 0 ? "partial" : "ok" });

  if (contentErrors.length > 0) {
    emit("warning", { message: `Some lesson content used fallback placeholders. You can regenerate these using the Refine tab.`, details: contentErrors });
  }
  emit("step", { step: "content", status: "complete" });

  // ── STEP 3: QUIZ GENERATION (parallel per module) ───────────
  const modulesWithQuizzes = course.modules.filter((m: any) => m.lessons.some((l: any) => l.type === "quiz"));

  if (modulesWithQuizzes.length > 0) {
    emit("step", { step: "quiz", status: "in_progress" });
    const step3Start = Date.now();
    let step3Retries = 0;
    let quizErrors: string[] = [];

    const quizPromises = course.modules.map(async (mod: any, i: number) => {
      const quizLessons = mod.lessons.filter((l: any) => l.type === "quiz");
      if (quizLessons.length === 0) return null;

      const expectedIds = quizLessons.map((l: any) => l.id);
      const quizContext = `Course: "${course.title}"
Module: "${mod.title}" — ${mod.description}
Content topics covered: ${mod.lessons.filter((l: any) => l.type === "text").map((l: any) => l.title).join(", ")}

Quiz lessons to generate questions for:
${JSON.stringify(quizLessons.map((l: any) => ({ id: l.id, title: l.title })), null, 2)}

Generate 4-5 scenario-based questions per quiz lesson. Return JSON. Start with {`;

      try {
        const result = await callWithValidation(
          apiKey, MODEL_QUIZ, buildQuizPrompt(options),
          quizContext, TOKENS_QUIZ, TEMP_QUIZ,
          (data) => validateQuizzes(data, expectedIds),
          `quiz-mod-${i}`,
        );
        step3Retries += result.retries;
        return { moduleIndex: i, quizzes: result.data.quizzes };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Quiz generation failed";
        quizErrors.push(`Module "${mod.title}": ${msg}`);
        console.error(`[quiz-mod-${i}] Failed:`, err);
        return null;
      }
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

    // Apply fallbacks for any quiz lessons that are still empty
    for (const mod of course.modules) {
      for (const les of mod.lessons) applyQuizFallbacks(les);
    }

    stepTimings.push({ step: "quiz", durationMs: Date.now() - step3Start, retries: step3Retries, status: quizErrors.length > 0 ? "partial" : "ok" });

    if (quizErrors.length > 0) {
      emit("warning", { message: `Some quiz questions used fallback placeholders. You can regenerate these using the Refine tab.`, details: quizErrors });
    }
    emit("step", { step: "quiz", status: "complete" });
  } else {
    stepTimings.push({ step: "quiz", durationMs: 0, retries: 0, status: "skipped" });
  }

  // ── STEP 4: POLISH (non-critical) ───────────────────────────
  emit("step", { step: "design", status: "in_progress" });
  const step4Start = Date.now();

  try {
    const polishContext = `Polish the copy for this fitness course:
Title: ${course.title}
Description: ${course.description}
Tagline: ${course.tagline}
Modules: ${JSON.stringify(course.modules.map((m: any) => ({ id: m.id, title: m.title, description: m.description })), null, 2)}

Return polished JSON. Start with {`;

    const result = await callWithValidation(
      apiKey, MODEL_POLISH, buildPolishPrompt(options),
      polishContext, TOKENS_POLISH, TEMP_POLISH,
      validatePolish, "polish",
    );

    const polish = result.data;
    if (polish.title && typeof polish.title === "string") course.title = polish.title;
    if (polish.description && typeof polish.description === "string") course.description = polish.description;
    if (polish.tagline && typeof polish.tagline === "string") course.tagline = polish.tagline;
    if (Array.isArray(polish.modules)) {
      for (const pm of polish.modules) {
        const mod = course.modules.find((m: any) => m.id === pm.id);
        if (mod) {
          if (pm.title && typeof pm.title === "string") mod.title = pm.title;
          if (pm.description && typeof pm.description === "string") mod.description = pm.description;
        }
      }
    }
    stepTimings.push({ step: "polish", durationMs: Date.now() - step4Start, retries: result.retries, status: "ok" });
  } catch {
    console.warn("[polish] Failed (non-critical), continuing with original copy");
    stepTimings.push({ step: "polish", durationMs: Date.now() - step4Start, retries: MAX_RETRIES, status: "failed" });
  }

  emit("step", { step: "design", status: "complete" });

  // ── COMPUTE METRICS ─────────────────────────────────────────
  const metrics = computeMetrics(course, stepTimings);

  console.log("═══ GENERATION QUALITY METRICS ═══");
  console.log(`Course: "${course.title}"`);
  console.log(`Modules: ${metrics.totalModules} | Lessons: ${metrics.totalLessons}`);
  console.log(`Lessons by type:`, metrics.lessonsByType);
  console.log(`Text lessons — avg: ${metrics.avgWordsPerTextLesson} words, min: ${metrics.minWordsTextLesson}, max: ${metrics.maxWordsTextLesson}`);
  console.log(`Quiz questions: ${metrics.totalQuizQuestions} total`);
  console.log(`Assignments: ${metrics.assignmentCount} (avg ${metrics.avgAssignmentWords} words)`);
  if (metrics.emptyContentLessons.length > 0) console.warn(`Empty content lessons:`, metrics.emptyContentLessons);
  if (metrics.emptyQuizLessons.length > 0) console.warn(`Empty quiz lessons:`, metrics.emptyQuizLessons);
  if (metrics.emptyAssignmentLessons.length > 0) console.warn(`Empty assignment lessons:`, metrics.emptyAssignmentLessons);
  console.log(`Step timings:`, stepTimings);
  console.log(`Total generation time: ${metrics.totalDurationMs}ms (${(metrics.totalDurationMs / 1000).toFixed(1)}s)`);
  console.log("══════════════════════════════════");

  return { course, metrics };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 8: REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured. Set it in your Supabase project's edge function secrets.");

    const { prompt, options, stream } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      throw new Error("Please provide a course idea (at least 3 characters).");
    }

    // ── STREAMING MODE ──────────────────────────────────────────
    if (stream) {
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const { course, metrics, outlineOnly } = await runPipeline(
              ANTHROPIC_API_KEY, prompt.trim(), options,
              (event, data) => controller.enqueue(sseEvent(encoder, event, data)),
            );

            controller.enqueue(sseEvent(encoder, "metrics", metrics));
            if (outlineOnly) {
              // Outline-first flow: emit outline_ready instead of complete
              controller.enqueue(sseEvent(encoder, "outline_ready", course));
            } else {
              controller.enqueue(sseEvent(encoder, "complete", course));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            console.error("Pipeline error:", err);
            const msg = err instanceof Error ? err.message : "Generation failed";
            try { controller.enqueue(sseEvent(encoder, "error", { message: msg })); } catch { /* already closed */ }
            try { controller.enqueue(encoder.encode("data: [DONE]\n\n")); } catch { /* already closed */ }
            try { controller.close(); } catch { /* already closed */ }
          }
        },
      });

      return new Response(readableStream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // ── NON-STREAMING MODE ────────────────────────────────────
    const { course, metrics } = await runPipeline(ANTHROPIC_API_KEY, prompt.trim(), options);
    return new Response(JSON.stringify({ ...course, _metrics: metrics }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-course error:", e);
    const message = e instanceof Error ? e.message : "An unexpected error occurred during course generation.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
