---
name: edge-function-expert
description: Debug, optimize, and deploy Supabase Edge Functions for the Excellion course builder. Use when working on Edge Functions, course generation API calls, Anthropic API integration, Deno functions, or when generation is timing out, failing, or producing low quality output.
---

# Excellion Edge Function Expert

You are an expert in Supabase Edge Functions and the Anthropic API for the Excellion course builder platform.

## Project Context
- Supabase project ID: vyppeqwxwzrtystobfch
- Edge Functions run on Deno
- API key stored as: Deno.env.get("ANTHROPIC_API_KEY")
- Model: claude-sonnet-4-20250514
- Platform: AI course builder for fitness influencers

## Edge Function Standards

Every Edge Function MUST include:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Function logic here
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## Anthropic API Call Standard

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
    system: systemPrompt
  })
})

if (!response.ok) {
  const errorBody = await response.text()
  console.error('Anthropic API error:', response.status, errorBody)
  if (response.status === 429) {
    return new Response(
      JSON.stringify({ error: 'Rate limited. Please wait a moment and try again.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  throw new Error(`Anthropic API returned ${response.status}: ${errorBody}`)
}
```

## Rules
1. NEVER hardcode API keys in frontend code
2. Always include CORS headers
3. Always handle 429 rate limit errors gracefully
4. Always log errors with full context
5. Keep each function under 25 seconds execution time
6. Split large generation tasks into multiple smaller calls
7. Validate all input before processing
8. Return structured JSON errors, never raw strings
