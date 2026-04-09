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
const MAX_TOKENS = 4000;

// Fitness-only topic validation
const FITNESS_KEYWORDS = /fitness|workout|training|exercise|gym|strength|cardio|hiit|yoga|pilates|mobility|flexibility|nutrition|diet|meal|protein|fat loss|weight loss|muscle|bodybuilding|calisthenics|crossfit|running|marathon|cycling|swimming|boxing|martial arts|mma|kickboxing|health|wellness|coaching|personal trainer|sports|athletic|recovery|stretching|posture|body|physique|transformation|bootcamp|endurance|conditioning|metabol|supplement|macro|keto|vegan|paleo|intermittent fasting|mindset|motivation|accountability|lifestyle|habit|sleep|stress|mental health|meditation|breathwork|holistic|functional|rehab|injury|prehab/i;

const SYSTEM_PROMPT = `You are Excellion's AI course builder for FITNESS, HEALTH, and WELLNESS creators ONLY.

STRICT RULE: You ONLY generate courses about fitness, health, nutrition, wellness, coaching, athletic training, and related topics. If the topic is not fitness/health related, respond with this exact JSON:
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

function isTimeoutError(error: unknown) {
  return error instanceof Error && (
    error.name === "TimeoutError" ||
    error.name === "AbortError" ||
    error.message.toLowerCase().includes("timed out")
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    // Payload size limit: 100KB
    const contentLength = parseInt(req.headers.get("content-length") || "0");
    if (contentLength > 102400) {
      return new Response(
        JSON.stringify({ error: "Request too large. Maximum payload size is 100KB." }),
        { status: 413, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }


    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("ANTHROPIC_KEY");
    if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

    // ── RATE LIMITING: 10 generations per hour per user ─────
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    // Cleanup old entries first (lightweight)
    try { await adminClient.rpc("cleanup_old_rate_limits"); } catch { /* ignore */ }

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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Log this call
    await adminClient.from("rate_limits").insert({
      user_id: authData.user.id,
      endpoint: "generate-course",
    });

    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 2000) : "";
    const options = body.options || {};
    const attachmentContent = typeof body.attachmentContent === "string" ? body.attachmentContent.slice(0, 15000) : "";

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Please describe your course idea." }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Fitness topic validation is handled by the AI system prompt itself.
    // The AI will return a fitness_only error JSON if the topic is off-limits.

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

    // ── BUILD USER MESSAGE ───────────────────────────────────
    const parts: string[] = [];

    // If there's attachment content, make it the PRIMARY input
    if (attachmentContent) {
      parts.push(`CREATOR'S DOCUMENT (USE THIS AS THE PRIMARY SOURCE):\n\n${attachmentContent.slice(0, 10000)}`);
      parts.push(`\nCreator's description: "${prompt}"`);
      parts.push(`\nINSTRUCTION: Build the course DIRECTLY from the document above. Use the creator's exact headings, topics, and terminology as module/lesson titles. Do NOT make up generic fitness content — extract it from their material.`);
    } else {
      parts.push(`Create a fitness course about: ${prompt}`);
    }

    // Context
    const durationCtx = durationWeeks <= 2 ? "SHORT intensive" : durationWeeks <= 4 ? "medium program" : "comprehensive program";
    const formatCtx = lessonFormat === "video" ? "VIDEO lessons" : lessonFormat === "written" ? "WRITTEN lessons" : "mixed format";
    const toneMap: Record<string, string> = { creator: "warm, personal", technical: "structured, systematic", academic: "formal, evidence-based", visual: "concise, creative" };
    const painCtx = painPoint ? ` Students tried "${painPoint}" and it didn't work — position as the solution.` : "";

    parts.push(`\nSettings: ${difficulty}, ${durationWeeks}wk (${durationCtx}), ${formatCtx}, ${toneMap[template] || "friendly"} style, ${tone} tone.${painCtx} Seed: ${designSeed}`);
    parts.push(`Return ONLY valid JSON.`);

    const userMessage = parts.join("\n");

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
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      if (response.status === 429) throw new Error("Rate limited. Please wait and try again.");
      throw new Error(`AI generation failed (${response.status}). Please try again.`);
    }

    const data = await response.json();
    const stopReason = data.stop_reason;
    const text = data.content?.[0]?.text || "";

    console.log("generate-course stop_reason:", stopReason, "text length:", text.length);

    if (stopReason === "max_tokens") {
      console.warn("generate-course: output was truncated by max_tokens");
    }

    const course = parseCourseJson(text);

    // Check if AI returned the fitness-only error
    if (course?.error === "fitness_only") {
      return new Response(JSON.stringify({ error: course.message }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (!course?.title || !Array.isArray(course?.modules) || course.modules.length === 0) {
      throw new Error("AI response missing required course fields");
    }

    console.log("generate-course success:", course.title, course.modules.length, "modules");

    return new Response(JSON.stringify(course), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-course error:", e);
    const status = isTimeoutError(e) ? 504 : 500;
    const message = isTimeoutError(e)
      ? "Course generation timed out. Please try again."
      : e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
