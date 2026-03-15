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
  depth?: "overview" | "standard" | "deep_dive";
  duration_weeks?: number;
  includeQuizzes?: boolean;
  includeAssignments?: boolean;
  template?: string;
  audience?: string;
  niche?: string;
  approvedOutline?: any;
  outlineOnly?: boolean;
}

export interface GenerationEvent {
  type: "step" | "outline" | "outline_ready" | "complete" | "error" | "warning" | "metrics";
  data: any;
}

export interface QualityMetrics {
  totalModules: number;
  totalLessons: number;
  lessonsByType: Record<string, number>;
  wordCountPerLesson: Array<{ id: string; title: string; type: string; wordCount: number }>;
  avgWordsPerTextLesson: number;
  minWordsTextLesson: number;
  maxWordsTextLesson: number;
  totalQuizQuestions: number;
  quizQuestionsPerModule: Record<string, number>;
  assignmentCount: number;
  avgAssignmentWords: number;
  emptyContentLessons: string[];
  emptyQuizLessons: string[];
  emptyAssignmentLessons: string[];
  generationSteps: Array<{ step: string; durationMs: number; retries: number; status: string }>;
  totalDurationMs: number;
}

export const AI = {
  /** Generate a full course from a prompt (non-streaming, backwards compatible) */
  generateCourse: (prompt: string, options?: CourseGenerationOptions) =>
    callEdgeFn("generate-course", { prompt, options }),

  /**
   * Generate a course with streaming progress events (SSE).
   * Yields GenerationEvent objects as the pipeline progresses:
   * - { type: "step", data: { step: "structure"|"content"|"quiz"|"design", status: "in_progress"|"complete" } }
   * - { type: "outline", data: courseOutline } — partial course (structure only, no lesson content)
   * - { type: "complete", data: fullCourse } — final course with all content
   * - { type: "error", data: { message: string } }
   */
  generateCourseStream: async function* (
    prompt: string,
    options?: CourseGenerationOptions,
  ): AsyncGenerator<GenerationEvent> {
    const headers = await getAuthHeaders();
    const res = await fetch(edgeFnUrl("generate-course"), {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt, options, stream: true }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`generate-course stream failed: ${err}`);
    }

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

      let currentEvent = "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed === "data: [DONE]") return;

        if (trimmed.startsWith("event: ")) {
          currentEvent = trimmed.slice(7);
        } else if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            yield { type: currentEvent as GenerationEvent["type"], data };
          } catch {
            // skip unparseable
          }
        }
      }
    }
  },

  /** Generate full content from an approved outline (phase 2 of outline-first flow) */
  generateFromOutlineStream: async function* (
    outline: any,
    options?: CourseGenerationOptions,
  ): AsyncGenerator<GenerationEvent> {
    const headers = await getAuthHeaders();
    const res = await fetch(edgeFnUrl("generate-course"), {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt: outline.title, options: { ...options, approvedOutline: outline }, stream: true }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`generate-course stream failed: ${err}`);
    }

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

      let currentEvent = "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed === "data: [DONE]") return;
        if (trimmed.startsWith("event: ")) {
          currentEvent = trimmed.slice(7);
        } else if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            yield { type: currentEvent as GenerationEvent["type"], data };
          } catch { /* skip */ }
        }
      }
    }
  },

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
