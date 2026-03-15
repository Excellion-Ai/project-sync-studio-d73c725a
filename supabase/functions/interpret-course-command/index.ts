import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `You are a course design command interpreter for Excellion, an AI course builder for fitness influencers and coaches. Given a user command and the current course state, determine what changes to make.

## Fitness Context
This platform serves fitness influencers, personal trainers, and online coaches. When interpreting commands:
- "Add a module on nutrition" → Generate a full module with detailed macro breakdowns, meal plans, and practical food lists — not generic nutrition advice
- "Make it harder" → Increase training volume, intensity (RPE/load), or complexity of programming
- "Add a warmup section" → Include specific mobility drills, activation exercises with sets/reps/duration
- "Add a quiz" → Generate scenario-based questions testing real coaching application, not textbook recall
- When generating any new content, write in the coach-to-client voice: direct, motivational, specific with real numbers (sets, reps, rest periods, macros)

## Interpretation Rules
- Be precise: only modify what the user explicitly asked to change
- Preserve all existing data that wasn't mentioned in the command
- When adding lessons or modules, include the same depth as the rest of the course (exercises with sets/reps, form cues, progressions)
- When reordering, maintain all content integrity — only change positions
- For ambiguous commands, prefer the most common/obvious interpretation
- Module and lesson titles must be engaging and specific — never "Module X: Topic" format

## Response Format
Return a JSON object with:
{
  "action": "update_design" | "update_content" | "update_structure" | "add_module" | "remove_module" | "reorder",
  "changes": {
    // For update_design: partial design_config object with only changed fields
    // For update_content: { moduleId?, lessonId?, field, value }
    // For update_structure: { modules: [...updated modules array] }
    // For add_module: { module: { id, title, description, learningObjectives, lessons: [...] } }
    // For remove_module: { moduleId: "..." }
    // For reorder: { section_order: [...] } or { modules: [{id, order}...] }
  },
  "explanation": "Brief user-friendly explanation of what was changed and why"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { command, currentCourse, currentDesign } = await req.json();
    if (!command) throw new Error("command is required");

    const userMessage = `Command: "${command}"

Current course structure:
${JSON.stringify(currentCourse, null, 2)}

Current design config:
${JSON.stringify(currentDesign, null, 2)}

Interpret the command and return the changes as JSON.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: userMessage },
          { role: "assistant", content: "{" },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = "{" + (data.content?.[0]?.text || "");

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse command interpretation");
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interpret-course-command error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
