import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `You are a website/course site blueprint architect. Given a business description and goals, generate a complete site specification as JSON.

Return a JSON object with:
{
  "siteName": "Name of the site",
  "siteType": "course_platform" | "landing_page" | "portfolio" | "business",
  "pages": [
    {
      "slug": "home",
      "title": "Page title",
      "sections": [
        { "type": "hero", "config": { "headline": "...", "subheadline": "...", "ctaText": "...", "style": "gradient|image|minimal" } },
        { "type": "features", "config": { "items": [...] } },
        { "type": "testimonials", "config": { "items": [...] } },
        { "type": "pricing", "config": { "plans": [...] } },
        { "type": "faq", "config": { "items": [...] } },
        { "type": "cta", "config": { ... } }
      ]
    }
  ],
  "branding": {
    "primaryColor": "#hex",
    "secondaryColor": "#hex",
    "accentColor": "#hex",
    "fontHeading": "font name",
    "fontBody": "font name",
    "style": "modern|luxury|playful|minimal|bold"
  },
  "seo": {
    "title": "SEO title",
    "description": "Meta description"
  }
}

Return ONLY valid JSON, no markdown fences.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { prompt, businessType, goal, style, context } = await req.json();
    if (!prompt) throw new Error("prompt is required");

    const userMessage = `Generate a site blueprint for: ${prompt}
${businessType ? `Business type: ${businessType}` : ""}
${goal ? `Goal: ${goal}` : ""}
${style ? `Preferred style: ${style}` : ""}
${context ? `Additional context: ${JSON.stringify(context)}` : ""}

Return ONLY valid JSON.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
      else throw new Error("Failed to parse blueprint JSON");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("builder-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
