import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Dynamic CORS — allow production + Lovable preview domains
function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ["https://excellioncourses.com", "https://www.excellioncourses.com"];
  const isAllowed = allowed.includes(origin) || origin.endsWith(".lovable.app") || origin.endsWith(".lovableproject.com");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowed[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const MODEL = "claude-sonnet-4-20250514";
const REQUEST_TIMEOUT_MS = 55000;
const PDF_TIMEOUT_MS = 120000;
const MAX_TOKENS = 4000;
const MAX_TOKENS_PDF = 6000; // PDFs need more room for detailed structures

// Fitness-only topic validation
const FITNESS_KEYWORDS = /fitness|workout|training|exercise|gym|strength|cardio|hiit|yoga|pilates|mobility|flexibility|nutrition|diet|meal|protein|fat loss|weight loss|muscle|bodybuilding|calisthenics|crossfit|running|marathon|cycling|swimming|boxing|martial arts|mma|kickboxing|health|wellness|coaching|personal trainer|sports|athletic|recovery|stretching|posture|body|physique|transformation|bootcamp|endurance|conditioning|metabol|supplement|macro|keto|vegan|paleo|intermittent fasting|mindset|motivation|accountability|lifestyle|habit|sleep|stress|mental health|meditation|breathwork|holistic|functional|rehab|injury|prehab/i;

const SYSTEM_PROMPT = `You are Excellion's AI course builder for FITNESS, HEALTH, and WELLNESS creators.

IMPORTANT: You specialize in fitness, health, nutrition, wellness, coaching, and athletic training courses. If a topic seems unrelated to fitness/health, try to reframe it with a fitness/wellness angle before rejecting. Only reject if the topic is completely impossible to relate to health/wellness (e.g., pure software engineering, accounting). If you must reject, respond with this exact JSON:
{"error":"fitness_only","message":"Excellion is built for fitness and health creators. Try describing your fitness program, nutrition plan, or wellness coaching instead."}

WHEN REFERENCE MATERIAL IS PROVIDED:
This is the #1 priority. The creator attached their own content (PDF, doc, notes). You MUST:
- Read EVERY word of the provided material
- Extract their exact topics, section names, frameworks, and terminology
- Use THEIR words as module and lesson titles — do NOT rephrase or make up alternatives
- Follow THEIR content structure and teaching order
- The generated course must feel like it was written BY this creator, not by AI
- If the material has 7 sections, make 7 modules (not always 5)
- If the material uses specific brand names or program names, keep them

WHEN NO REFERENCE MATERIAL:
Generate a course outline from scratch based on the topic. Use 5 modules, 3 lessons each.

OUTPUT: Compact JSON, no markdown fences.
- title, subtitle (NOT repeating title), description (2-3 sentences)
- learningOutcomes: 6 items
- modules: [{title, description, lessons: [{title, description}]}]
- design_config: {colors: {primary, secondary, accent, background, cardBackground, text, textMuted}, fonts: {heading, body}, spacing, borderRadius, heroStyle, heroLayout}
- target_audience, faq: [{question, answer}], section_order
- DESIGN: Dark bg (#0a-#15), light text, vibrant primary. Fonts from: "Playfair Display"+"DM Sans", "Space Grotesk"+"Inter", "Poppins"+"Inter", "Montserrat"+"DM Sans", "Lora"+"Inter"`;

function parseCourseJson(text: string) {
  // Strip markdown fences
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // Find JSON boundaries
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in AI response");
  cleaned = cleaned.substring(start, end + 1);

  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt repair: trailing commas, control chars
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, " ");
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      console.error("JSON repair failed, raw length:", cleaned.length, "error:", e2);
      throw new Error("Failed to parse course JSON from AI response");
    }
  }
}

function toTitleCase(input: string) {
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractReferenceHeadings(text: string, limit = 5) {
  return Array.from(new Set(
    text
      .split(/\n+/)
      .map((line) => line.replace(/^[-*#\d.\s]+/, "").trim())
      .filter((line) => line.length >= 6 && line.length <= 72)
      .filter((line) => !/^attached:/i.test(line))
      .filter((line) => !/^creator'?s description:/i.test(line))
  )).slice(0, limit);
}

function buildFallbackCourse(
  prompt: string,
  options: Record<string, unknown>,
  attachmentContent: string,
  hasPdf: boolean,
) {
  const extractedHeadings = extractReferenceHeadings(attachmentContent);
  const cleanedPrompt = prompt
    .replace(/\b(make|create|build|generate|outline|course|program|with|this|pdf|document|attached|attachment|from)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const topicSeed = extractedHeadings[0] || cleanedPrompt || "Signature Fitness Program";
  const title = toTitleCase(topicSeed);
  const durationWeeks = typeof options?.duration_weeks === "number" && options.duration_weeks > 0
    ? options.duration_weeks
    : 6;
  const moduleTitles = extractedHeadings.length > 0
    ? extractedHeadings.slice(0, 5)
    : [
        "Foundation & Goals",
        "Training Blueprint",
        "Nutrition & Recovery",
        "Weekly Execution",
        "Progress & Next Steps",
      ];

  return {
    title,
    subtitle: hasPdf || attachmentContent
      ? "A structured coaching program shaped from your reference material."
      : "A step-by-step fitness and wellness course your audience can implement fast.",
    description: `${title} gives students a clear path to build consistency, apply the core method, and track results week by week. You can now customize this outline with your exact lessons, videos, and coaching assets inside Excellion.`,
    learningOutcomes: [
      "Understand the program framework and expected transformation",
      "Follow a clear implementation path week by week",
      "Build better training and recovery consistency",
      "Identify common mistakes before they stall progress",
      "Measure progress with simple checkpoints",
      "Create a repeatable routine that supports long-term results",
    ],
    modules: moduleTitles.map((moduleTitle: string, index: number) => ({
      title: moduleTitle,
      description: `Module ${index + 1} focuses on the key actions, coaching points, and implementation steps for ${moduleTitle.toLowerCase()}.`,
      lessons: [
        {
          title: `${moduleTitle}: Core Concepts`,
          description: `Introduce the main ideas and expectations for ${moduleTitle.toLowerCase()}.`,
        },
        {
          title: `${moduleTitle}: Action Plan`,
          description: `Turn the strategy into practical steps students can follow immediately.`,
        },
        {
          title: `${moduleTitle}: Review & Adjust`,
          description: "Help students evaluate progress and make the right next-step adjustments.",
        },
      ],
    })),
    design_config: {
      colors: { primary: "#e53e3e", secondary: "#1a1a2e", accent: "#f56565", background: "#0a0a0a", cardBackground: "#111111", text: "#ffffff", textMuted: "#9ca3af" },
      fonts: { heading: "Montserrat", body: "DM Sans" },
      spacing: "normal",
      borderRadius: "medium",
      heroStyle: "gradient",
      heroLayout: "left",
    },
    target_audience: "Fitness, health, and wellness clients who want a guided step-by-step transformation plan.",
    faq: [
      {
        question: "How long should students spend each week?",
        answer: `Plan for 2-4 focused sessions each week across the ${durationWeeks}-week program.`,
      },
      {
        question: "Is this suitable for beginners?",
        answer: "Yes — the outline is intentionally structured so you can adapt the final lessons to beginner, intermediate, or advanced students.",
      },
    ],
    section_order: ["hero", "outcomes", "who_is_for", "curriculum", "course_includes", "testimonials", "pricing", "guarantee", "faq"],
  };
}

function isTimeoutError(error: unknown) {
  return error instanceof Error && (
    error.name === "TimeoutError" ||
    error.name === "AbortError" ||
    error.message.toLowerCase().includes("timed out")
  );
}

serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // ── STEP 1: Auth ────────────────────────────────────────
    console.log("generate-course: step 1 — checking auth");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: authData, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !authData?.user) {
      console.error("generate-course: auth failed", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    console.log("generate-course: step 1 done — user:", authData.user.id.slice(0, 8));

    // ── STEP 2: Parse body ──────────────────────────────────
    console.log("generate-course: step 2 — parsing body");
    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("generate-course: body parse failed:", parseError);
      return new Response(JSON.stringify({ error: "Invalid request body. The file may be too large." }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 2000) : "";
    const options = body.options || {};
    const attachmentContent = typeof body.attachmentContent === "string" ? body.attachmentContent.slice(0, 15000) : "";

    // Clean PDF base64 — strip data URL prefix if present
    let pdfBase64 = typeof body.pdfBase64 === "string" && body.pdfBase64.length > 100 ? body.pdfBase64 : "";
    if (pdfBase64.startsWith("data:")) {
      const commaIdx = pdfBase64.indexOf(",");
      if (commaIdx > 0) pdfBase64 = pdfBase64.slice(commaIdx + 1);
    }

    console.log("generate-course: step 2 done —", JSON.stringify({
      promptLength: prompt.length,
      promptPreview: prompt.slice(0, 80),
      attachmentLength: attachmentContent.length,
      hasPdf: !!pdfBase64,
      pdfLength: pdfBase64.length,
    }));

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Please describe your course idea." }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const refersToUploadedFile = /\b(this pdf|attached pdf|attached document|attached file|uploaded pdf|uploaded file|this document)\b/i.test(prompt);
    if (refersToUploadedFile && !attachmentContent && !pdfBase64) {
      console.warn("generate-course: user refers to attachment but none received — proceeding without it");
      // Don't block — just generate from the prompt text alone
    }

    // ── STEP 3: API key check ───────────────────────────────
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("ANTHROPIC_KEY");
    if (!anthropicApiKey) {
      console.error("generate-course: ANTHROPIC_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured. Please contact support." }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── STEP 4: Rate limiting ───────────────────────────────
    console.log("generate-course: step 4 — rate limiting");
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    try {
      await adminClient.rpc("cleanup_old_rate_limits");
    } catch { /* ignore */ }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await adminClient
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authData.user.id)
      .eq("endpoint", "generate-course")
      .gte("called_at", oneHourAgo);

    if ((count ?? 0) >= 10) {
      return new Response(JSON.stringify({
        error: "You've reached the limit of 10 course generations per hour. Please try again later.",
      }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    await adminClient.from("rate_limits").insert({
      user_id: authData.user.id,
      endpoint: "generate-course",
    });
    console.log("generate-course: step 4 done — rate limit OK");

    // ── STEP 5: Build prompt ────────────────────────────────
    console.log("generate-course: step 5 — building prompt");
    const combinedText = `${prompt} ${attachmentContent || ""}`;
    const isFitnessExplicit = FITNESS_KEYWORDS.test(combinedText);

    const designSeed = Math.random().toString(36).slice(2, 6);
    const difficulty = options?.difficulty || "beginner";
    const durationWeeks = options?.duration_weeks || 6;
    const template = options?.template || "creator";
    const lessonFormat = options?.lessonFormat || "mixed";
    const painPoint = options?.audiencePainPoint || "";

    // Tone detection
    const hasSlang = /gonna|wanna|gotta|bro|dude|lol|tbh|fr|ngl/i.test(prompt);
    const isFormal = /comprehensive|methodology|framework|professional|certification/i.test(prompt);
    const tone = isFormal ? "professional and authoritative"
      : hasSlang ? "energetic, casual, and motivating"
      : "friendly and approachable";

    const parts: string[] = [];

    if (pdfBase64) {
      parts.push(`The creator has uploaded a PDF document. Read EVERY page carefully and build the course structure directly from their content.`);
      parts.push(`Creator's description: "${prompt}"`);
      parts.push(`INSTRUCTION: Use the creator's exact headings, topics, terminology, and teaching order as module/lesson titles. Do NOT make up generic content — extract everything from the PDF.`);
    } else if (attachmentContent && !attachmentContent.startsWith("[PDF")) {
      parts.push(`CREATOR'S DOCUMENT (USE THIS AS THE PRIMARY SOURCE):\n\n${attachmentContent.slice(0, 10000)}`);
      parts.push(`\nCreator's description: "${prompt}"`);
      parts.push(`\nINSTRUCTION: Build the course DIRECTLY from the document above. Use the creator's exact headings, topics, and terminology as module/lesson titles.`);
    } else {
      parts.push(`Create a fitness/health/wellness course about: ${prompt}${!isFitnessExplicit ? " (Note: Excellion is for fitness creators — frame this as a fitness/health/wellness program)" : ""}`);
    }

    const durationCtx = durationWeeks <= 2 ? "SHORT intensive" : durationWeeks <= 4 ? "medium program" : "comprehensive program";
    const formatCtx = lessonFormat === "video" ? "VIDEO lessons" : lessonFormat === "written" ? "WRITTEN lessons" : "mixed format";
    const toneMap: Record<string, string> = { creator: "warm, personal", technical: "structured, systematic", academic: "formal, evidence-based", visual: "concise, creative" };
    const painCtx = painPoint ? ` Students tried "${painPoint}" and it didn't work — position as the solution.` : "";

    parts.push(`\nSettings: ${difficulty}, ${durationWeeks}wk (${durationCtx}), ${formatCtx}, ${toneMap[template] || "friendly"} style, ${tone} tone.${painCtx} Seed: ${designSeed}`);
    parts.push(`Return ONLY valid JSON.`);

    const userMessage = parts.join("\n");

    // Build message content
    const messageContent: any[] = [];
    const hasPdf = !!pdfBase64;

    if (hasPdf) {
      console.log("generate-course: step 5 — attaching PDF document block, base64 length:", pdfBase64.length);
      messageContent.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: pdfBase64,
        },
      });
      messageContent.push({
        type: "text",
        text: `Read the entire PDF document above carefully. ${userMessage}`,
      });
    } else {
      messageContent.push({ type: "text", text: userMessage });
    }

    // ── STEP 6: Call Claude API ──────────────────────────────
    const timeoutMs = hasPdf ? PDF_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
    const maxTokens = hasPdf ? MAX_TOKENS_PDF : MAX_TOKENS;
    console.log("generate-course: step 6 — calling Claude API", { model: MODEL, timeoutMs, maxTokens, hasPdf });

    const apiHeaders: Record<string, string> = {
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    };
    // Add PDF beta header only when sending a PDF document
    if (hasPdf) {
      apiHeaders["anthropic-beta"] = "pdfs-2024-09-25";
    }

    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          model: MODEL,
          max_tokens: maxTokens,
          temperature: 0.3,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: messageContent }],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (fetchErr) {
      console.error("generate-course: step 6 fetch error:", fetchErr);
      if (isTimeoutError(fetchErr)) {
        return new Response(JSON.stringify({ error: "Course generation timed out. For large PDFs, try uploading a shorter document or describe your course without an attachment." }), {
          status: 504,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      throw fetchErr;
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("generate-course: Claude API error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limited. Please wait a minute and try again." }), {
          status: 429,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      // If PDF-specific error, give actionable advice
      if (hasPdf && (response.status === 400 || response.status === 413)) {
        return new Response(JSON.stringify({ error: "The PDF could not be processed. Try a smaller file (under 20 pages) or paste the content as text instead." }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI generation failed (${response.status}). Please try again.`);
    }

    // ── STEP 7: Parse response ──────────────────────────────
    console.log("generate-course: step 7 — parsing Claude response");
    const data = await response.json();
    const stopReason = data.stop_reason;
    const text = data.content?.[0]?.text || "";

    console.log("generate-course: stop_reason:", stopReason, "text length:", text.length);
    console.log("generate-course: raw response preview:", text.slice(0, 500));

    if (stopReason === "max_tokens") {
      console.warn("generate-course: output was truncated by max_tokens");
    }

    let course: any;
    try {
      course = parseCourseJson(text);
    } catch (parseErr) {
      console.error("generate-course: JSON parse failed. Raw text:", text.slice(0, 1000));
      console.warn("generate-course: using fallback outline after JSON parse failure");
      course = buildFallbackCourse(prompt, options, attachmentContent, hasPdf);
    }

    // Check if AI returned the fitness-only error
    if (course?.error === "fitness_only") {
      if (hasPdf || attachmentContent) {
        console.warn("generate-course: AI returned fitness_only despite reference material; using fallback outline");
        course = buildFallbackCourse(prompt, options, attachmentContent, hasPdf);
      } else {
      return new Response(JSON.stringify({ error: course.message }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
      }
    }

    // ── STEP 8: Validate & fill defaults ────────────────────
    console.log("generate-course: step 8 — validating course structure");

    if (!course?.title) {
      console.error("generate-course: missing title. Keys present:", Object.keys(course || {}));
      course = course || {};
      course.title = course.title || prompt.slice(0, 80);
    }

    if (!Array.isArray(course.modules) || course.modules.length === 0) {
      console.error("generate-course: missing/empty modules. Keys present:", Object.keys(course || {}));
      if (Array.isArray(course.curriculum)) {
        course.modules = course.curriculum;
      } else if (course.outline && Array.isArray(course.outline)) {
        course.modules = course.outline;
      } else {
        throw new Error("The AI couldn't generate a proper course structure. Please try again with a clearer description.");
      }
    }

    // Normalize modules
    course.modules = course.modules.map((mod: any, i: number) => ({
      id: mod.id || `mod-${i}`,
      title: mod.title || `Module ${i + 1}`,
      description: mod.description || "",
      lessons: Array.isArray(mod.lessons) ? mod.lessons.map((l: any, j: number) => ({
        id: l.id || `les-${i}-${j}`,
        title: l.title || `Lesson ${j + 1}`,
        description: l.description || "",
        duration: l.duration || "20m",
        type: l.type || "text",
      })) : [],
    }));

    // Fill in other defaults
    if (!course.subtitle) course.subtitle = "";
    if (!course.description) course.description = "";
    if (!Array.isArray(course.learningOutcomes)) course.learningOutcomes = [];
    if (!course.target_audience) course.target_audience = "";
    if (!Array.isArray(course.faq)) course.faq = [];
    if (!Array.isArray(course.section_order)) {
      course.section_order = ["hero", "outcomes", "who_is_for", "curriculum", "course_includes", "testimonials", "pricing", "guarantee", "faq"];
    }
    if (!course.design_config) {
      course.design_config = {
        colors: { primary: "#e53e3e", secondary: "#1a1a2e", accent: "#f56565", background: "#0a0a0a", cardBackground: "#111111", text: "#ffffff", textMuted: "#9ca3af" },
        fonts: { heading: "Montserrat", body: "DM Sans" },
        spacing: "normal",
        borderRadius: "medium",
        heroStyle: "gradient",
        heroLayout: "left",
      };
    }

    console.log("generate-course: SUCCESS —", course.title, ",", course.modules.length, "modules");

    return new Response(JSON.stringify(course), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-course: UNHANDLED ERROR:", e);
    const status = isTimeoutError(e) ? 504 : 500;
    const message = isTimeoutError(e)
      ? "Course generation timed out. For large PDFs, try a shorter document."
      : e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
