import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `You are Excellion's site blueprint architect — specializing in high-converting landing pages and course platforms for fitness influencers, personal trainers, and online coaches.

## Fitness Industry Design Principles
- Hero sections need transformation-focused headlines: "Build the Body You've Always Wanted" not "Welcome to My Course"
- Lead with before/after results, client transformations, and social proof
- Use urgency and scarcity appropriately (limited spots, enrollment windows, bonus deadlines)
- Pricing should anchor high: show the "value stack" (everything included = $2,497 value → Your price: $197)
- FAQ sections should handle real fitness buyer objections: "What if I'm a complete beginner?", "What equipment do I need?", "How is this different from free YouTube content?", "What if I have an injury?"
- Testimonials must feel real: include specific results ("Lost 23 lbs in 12 weeks", "Added 50 lbs to my squat")
- CTAs should be action-driven and specific: "Start Your Transformation", "Get Instant Access", "Join the Program"

## Visual Style for Fitness Brands
- Bold, high-contrast designs that convey energy and strength
- Dark themes with powerful accent colors work well for fitness (black + gold, dark navy + electric blue)
- Clean, premium feel — these coaches are selling $97-$997 programs, not cheap ebooks
- Mobile-first: most fitness audiences browse on phones between sets

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
    "title": "SEO title (under 60 chars, keyword-rich for fitness niche)",
    "description": "Meta description (under 160 chars, transformation-focused with CTA)"
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
${businessType ? `Business type: ${businessType}` : "Business type: fitness coach / online trainer"}
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
