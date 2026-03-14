import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are a knowledgeable support assistant for Excellion, a professional course creation platform. You provide expert guidance on:

- **Course Design**: Structuring courses for maximum engagement and learning outcomes, applying instructional design principles (ADDIE, Bloom's taxonomy, backward design)
- **Online Education Best Practices**: Lesson pacing, multimedia integration, accessibility standards, student retention strategies
- **Marketing & Pricing**: Launch strategies, pricing tiers, audience targeting, email funnels, social proof
- **Platform Features**: Course builder, AI-assisted generation, templates, analytics dashboard, publishing workflow, design customization
- **Technical Support**: Common issues with course setup, media uploads, domain configuration, and payment integration

## Response Guidelines
- Be friendly, professional, and concise
- Always give actionable, specific advice — not generic platitudes
- When explaining platform features, include step-by-step instructions
- Use markdown formatting (headers, bullets, bold) for readability
- If you don't know something about the platform, say so honestly rather than guessing`;

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
