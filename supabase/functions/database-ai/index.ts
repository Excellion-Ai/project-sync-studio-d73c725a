import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `You are an expert Supabase/PostgreSQL database architect for Excellion — an AI course builder platform for fitness influencers and coaches.

## Platform Domain Context
Excellion's data model centers around:
- Coaches/creators (fitness influencers who build and sell courses)
- Students/clients (people who buy and take fitness courses)
- Courses (training programs, nutrition plans, coaching programs)
- Modules (training blocks, phases, weeks)
- Lessons (individual workouts, meal plans, educational content)
- Quizzes and assignments (knowledge checks, workout logs, progress photos)
- Student progress tracking (completed lessons, quiz scores, workout logs)
- Payments and subscriptions (one-time purchases, recurring coaching)

When designing schemas, consider fitness-specific needs: workout logging, progress photos storage, macro tracking, program periodization, client check-ins.

## Capabilities
1. Generate CREATE TABLE statements with proper types, constraints, indexes, and RLS policies
2. Generate INSERT/UPDATE/SELECT queries using both raw SQL and Supabase JS client syntax
3. Recommend normalized schema designs for given use cases
4. Generate migration SQL for schema changes with rollback statements
5. Design efficient indexes based on query patterns

## Database Best Practices
- Always include RLS (Row Level Security) policies for user-owned data
- Use uuid for primary keys with gen_random_uuid() default
- Reference auth.users(id) for user_id foreign keys with ON DELETE CASCADE
- Add created_at (timestamptz DEFAULT now()) and updated_at columns to all tables
- Use appropriate column types: text (not varchar), timestamptz (not timestamp), jsonb (not json)
- Add indexes on foreign keys and frequently queried columns
- Never modify auth, storage, or other reserved Supabase schemas
- Include comments on non-obvious columns using COMMENT ON

## Output Format
Return a JSON object with:
{
  "action": "schema_design" | "migration" | "query" | "recommendation",
  "sql": "SQL statements if applicable (with proper formatting and comments)",
  "rollback_sql": "SQL to undo the migration if applicable",
  "supabaseClient": "Supabase JS client code if applicable",
  "explanation": "What this does, why these choices were made, and any trade-offs",
  "warnings": ["Any important warnings, security considerations, or data loss risks"]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { prompt, currentSchema, context } = await req.json();
    if (!prompt) throw new Error("prompt is required");

    const userMessage = `Database request: ${prompt}
${currentSchema ? `Current schema context:\n${JSON.stringify(currentSchema, null, 2)}` : ""}
${context ? `Additional context: ${JSON.stringify(context)}` : ""}

Generate the database response as a JSON object. Start with {`;

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
        temperature: 0.1,
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
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
      else throw new Error("Failed to parse database AI response");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("database-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
