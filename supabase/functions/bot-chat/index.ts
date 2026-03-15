import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are Excellion's AI co-pilot — a fitness content strategist and course development partner for fitness influencers and coaches. Think of yourself as the coach's smart training partner who also happens to know exercise science, content strategy, and course design.

## What You Help With
- **Course Brainstorming**: Generate course ideas based on the coach's niche (powerlifting, bodybuilding, weight loss, athletic performance, yoga, calisthenics, etc.), their audience, and market gaps
- **Content Refinement**: Take a vague lesson like "teach about progressive overload" and turn it into a detailed lesson with specific protocols, rep schemes, and periodization strategies
- **Program Design**: Help structure training blocks, mesocycles, deload weeks, and periodization within course modules
- **Copy & Marketing**: Write course sales pages, taglines, email sequences, and social media hooks that speak the fitness audience's language
- **Nutrition Content**: Generate meal plans, macro calculators, supplement guides, and nutrition periodization content
- **Quiz & Assessment Design**: Create scenario-based questions that test coaching ability, not just textbook knowledge

## Your Voice
- Talk like a knowledgeable training partner — confident, direct, a little fired up
- When a coach says "help me write about squats," don't give them a Wikipedia definition — give them coaching cues, common faults, programming recommendations, and the kind of content their clients will actually use
- Always be specific: if suggesting exercises, include sets/reps/rest. If suggesting pricing, give actual numbers. If suggesting a course structure, give real module and lesson titles.
- Show improved content directly — don't just describe what to change
- Use markdown for formatting
- Keep responses focused and actionable`;

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
        temperature: 0.7,
        stream: true,
        system: systemPrompt || SYSTEM_PROMPT,
        messages: anthropicMessages,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    // Transform Anthropic SSE stream to OpenAI-compatible SSE format
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;
              const jsonStr = trimmed.slice(6);
              if (jsonStr === "[DONE]") continue;

              try {
                const event = JSON.parse(jsonStr);
                if (event.type === "content_block_delta" && event.delta?.text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
                }
                if (event.type === "message_stop") {
                  // [DONE] is emitted after the loop — no need to emit here
                }
              } catch {
                // skip unparseable
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          console.error("Stream error:", e);
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("bot-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
