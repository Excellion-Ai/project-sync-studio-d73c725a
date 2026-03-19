import { supabase } from "@/integrations/supabase/client";

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

function unwrap(fnName: string, data: unknown, error: unknown) {
  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`AI.${fnName} failed: ${msg}`);
  }
  return data;
}

export const AI = {
  async generateCourse(prompt: string, options?: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke("generate-course", {
      body: { prompt, options },
    });
    return unwrap("generateCourse", data, error);
  },

  async interpretCommand(
    command: string,
    currentCourse: Record<string, unknown>,
    currentDesign?: Record<string, unknown>
  ) {
    const { data, error } = await supabase.functions.invoke("interpret-course-command", {
      body: { command, current_course: currentCourse, current_design: currentDesign },
    });
    return unwrap("interpretCommand", data, error);
  },

  async builderAgent(payload: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke("builder-agent", {
      body: payload,
    });
    return unwrap("builderAgent", data, error);
  },

  async generateCode(payload: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke("code-agent", {
      body: payload,
    });
    return unwrap("generateCode", data, error);
  },

  async chatStream(
    messages: Array<{ role: string; content: string }>,
    extras?: Record<string, unknown>
  ): Promise<Response> {
    const headers = await getAuthHeaders();
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bot-chat`;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages, ...extras }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`AI.chatStream failed (${res.status}): ${text}`);
    }
    return res;
  },

  async help(
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string
  ) {
    const { data, error } = await supabase.functions.invoke("help-chat", {
      body: { messages, systemPrompt },
    });
    return unwrap("help", data, error);
  },

  async generateQuery(query: string, schema?: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke("database-ai", {
      body: { query, schema },
    });
    return unwrap("generateQuery", data, error);
  },

  async generateImage(prompt: string, width = 1024, height = 1024) {
    const { data, error } = await supabase.functions.invoke("generate-image", {
      body: { prompt, width, height },
    });
    return unwrap("generateImage", data, error);
  },

  async generateNicheImage(payload: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke("generate-niche-image", {
      body: payload,
    });
    return unwrap("generateNicheImage", data, error);
  },
};
