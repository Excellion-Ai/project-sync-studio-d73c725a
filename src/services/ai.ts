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

function edgeFnUrl(name: string) {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;
}

async function callEdgeFn<T = any>(fnName: string, body: Record<string, unknown>): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(edgeFnUrl(fnName), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Edge function ${fnName} failed: ${err}`);
  }
  return res.json();
}

export interface CourseGenerationOptions {
  difficulty?: string;
  duration_weeks?: number;
  includeQuizzes?: boolean;
  includeAssignments?: boolean;
  template?: string;
}

export const AI = {
  /** Generate a full course from a prompt */
  generateCourse: (prompt: string, options?: CourseGenerationOptions) =>
    callEdgeFn("generate-course", { prompt, options }),

  /** Interpret a design/content command against current course state */
  interpretCommand: (command: string, currentCourse: any, currentDesign: any) =>
    callEdgeFn("interpret-course-command", { command, currentCourse, currentDesign }),

  /** Help chat (non-streaming) */
  help: (messages: Array<{ role: string; content: string }>, systemPrompt?: string) =>
    callEdgeFn("help-chat", { messages, systemPrompt }),

  /** Generate an image */
  generateImage: (prompt: string, width = 1024, height = 1024) =>
    callEdgeFn("generate-image", { prompt, width, height }),

  /** Generate a niche-specific image */
  generateNicheImage: (payload: Record<string, unknown>) =>
    callEdgeFn("generate-niche-image", payload),

  /** Generate site spec / blueprint */
  builderAgent: (prompt: string, extras?: Record<string, unknown>) =>
    callEdgeFn("builder-agent", { prompt, ...extras }),

  /** Generate React code from spec */
  codeAgent: (prompt: string, spec?: Record<string, unknown>, existingCode?: string) =>
    callEdgeFn("code-agent", { prompt, spec, existingCode }),

  /** Database schema queries / SQL generation */
  databaseAI: (prompt: string, currentSchema?: Record<string, unknown>, context?: Record<string, unknown>) =>
    callEdgeFn("database-ai", { prompt, currentSchema, context }),

  /** Streaming chat via bot-chat edge function */
  chatStream: async function* (
    messages: Array<{ role: string; content: string }>,
    extras?: Record<string, unknown>
  ) {
    const headers = await getAuthHeaders();
    const res = await fetch(edgeFnUrl("bot-chat"), {
      method: "POST",
      headers,
      body: JSON.stringify({ messages, ...extras }),
    });
    if (!res.ok) throw new Error(`bot-chat failed: ${await res.text()}`);
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const data = trimmed.slice(6);
          if (data === "[DONE]") return;
          try {
            yield JSON.parse(data);
          } catch {
            yield { text: data };
          }
        }
      }
    }
  },

  /** Check user credits */
  checkCredits: (action: string) =>
    callEdgeFn("check-credits", { action }),

  /** Deduct credits after successful action */
  deductCredits: (action: string, amount: number) =>
    callEdgeFn("deduct-credits", { action, amount }),
};
