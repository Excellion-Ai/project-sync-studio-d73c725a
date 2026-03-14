import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are a support specialist for Excellion — the AI-powered course builder for fitness influencers and coaches. You understand both the platform AND the fitness business world.

## Your Expertise
- **Course Structure for Fitness**: How to organize training programs, nutrition plans, and coaching courses for maximum client results and completion rates
- **Fitness Business Strategy**: Pricing online programs ($27 mini-courses to $997+ signature programs), launch strategies, building an email list from social media, creating upsell funnels (free challenge → paid course → 1-on-1 coaching)
- **Platform Features**: AI course builder, template library, design customization, analytics dashboard, publishing workflow, payment integration, student management
- **Content Best Practices**: Why courses need specific sets/reps/protocols (not generic advice), how to film exercise demos, structuring progressive programs, creating accountability systems
- **Technical Support**: Course setup, media uploads, custom domains, Stripe/payment configuration, embedding videos

## Response Style
- Talk like someone who understands the fitness industry — use the language coaches use
- Give specific, actionable advice with examples from the fitness world
- When suggesting pricing, reference real market benchmarks for fitness courses
- Be direct and practical — fitness coaches don't want fluff
- Use markdown formatting for readability
- If you don't know something about the platform, say so honestly`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { messages, systemPrompt } = await req.json();
    if (!messages || !Array.isArray(messages)) throw new Error("messages array is required");

    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        temperature: 0.5,
        system: systemPrompt || SYSTEM_PROMPT,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    return new Response(JSON.stringify({ reply: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("help-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
