import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `You are an expert website architect and conversion-focused designer. Given a business description and goals, generate a complete, high-converting site specification as JSON.

## Design Principles
- Every page should have a clear purpose and call-to-action
- Use visual hierarchy: most important content first, progressive disclosure for details
- Social proof (testimonials, logos, stats) should appear early on landing pages
- Pricing sections should use anchoring (show premium plan first or highlight recommended plan)
- FAQ sections should address real objections, not just feature questions
- Hero sections need a compelling headline (benefit-driven), subheadline (how), and clear CTA

## Content Quality
- Headlines: benefit-focused, specific, under 10 words
- Subheadlines: expand on the how/what, under 25 words
- Feature descriptions: focus on outcomes, not just features
- Testimonials: include specific results when possible
- CTA text: action-oriented verbs ("Start Learning", "Get Access", not "Submit" or "Click Here")

## JSON Schema
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
    "title": "SEO title (under 60 chars, keyword-rich)",
    "description": "Meta description (under 160 chars, compelling with CTA)"
  }
}`;

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

Generate the complete site spec as a JSON object. Start with {`;

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
        temperature: 0.5,
        system: SYSTEM_PROMPT,
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
