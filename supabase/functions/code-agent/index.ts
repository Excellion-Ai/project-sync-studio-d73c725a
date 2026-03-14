import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `You are an expert React code generation agent. Given a component specification or design blueprint, generate clean, production-ready React + TypeScript + Tailwind CSS code.

## Code Quality Standards
- Use functional components with hooks (useState, useEffect, useMemo, useCallback as appropriate)
- Use TypeScript with explicit prop interfaces and proper typing — no \`any\` types
- Use Tailwind CSS for all styling (dark theme with gold accents by default)
- Import from shadcn/ui components when applicable (Button, Card, Input, Dialog, etc.)
- Make all components fully responsive (mobile-first approach)
- Include proper accessibility: aria-labels, roles, keyboard navigation, focus management
- Handle loading and error states when components fetch data
- Use semantic HTML elements (section, nav, main, article, etc.)
- Follow React best practices: proper key props, memoization where needed, no inline object/function creation in JSX

## Output Format
Return a JSON object with:
{
  "files": [
    {
      "path": "src/components/ComponentName.tsx",
      "content": "// Full component code here"
    }
  ],
  "dependencies": ["list of any new npm packages needed"],
  "explanation": "Brief explanation of generated code and key design decisions"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { prompt, spec, existingCode } = await req.json();
    if (!prompt && !spec) throw new Error("prompt or spec is required");

    const userMessage = `${prompt ? `Request: ${prompt}` : ""}
${spec ? `Component spec:\n${JSON.stringify(spec, null, 2)}` : ""}
${existingCode ? `Existing code to modify:\n${existingCode}` : ""}

Generate the React component code as a JSON object. Start with {`;

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
        temperature: 0.2,
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
      else throw new Error("Failed to parse code generation response");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("code-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
