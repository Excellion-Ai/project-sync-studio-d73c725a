import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Dynamic CORS — allow production + Lovable preview domains
function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ["https://excellioncourses.com", "https://www.excellioncourses.com"];
  const isAllowed = allowed.includes(origin) || origin.endsWith(".lovable.app") || origin.endsWith(".lovableproject.com");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowed[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// This function is now a LIGHTWEIGHT helper — it generates a brief description
// for a lesson, NOT full content. Creators add their own content.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    // Payload size limit: 100KB
    const contentLength = parseInt(req.headers.get("content-length") || "0");
    if (contentLength > 102400) {
      return new Response(
        JSON.stringify({ error: "Request too large. Maximum payload size is 100KB." }),
        { status: 413, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }


    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: authData, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // ── RATE LIMITING: 50 lesson generations per hour per user ──
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await adminClient
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authData.user.id)
      .eq("endpoint", "generate-lesson-content")
      .gte("called_at", oneHourAgo);

    if ((count ?? 0) >= 50) {
      return new Response(JSON.stringify({
        error: "Rate limit reached for lesson generation. Please try again later.",
      }), {
        status: 429,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    await adminClient.from("rate_limits").insert({
      user_id: authData.user.id,
      endpoint: "generate-lesson-content",
    });

    const { moduleTitle, lessonTitle, lessonTitles } = await req.json();

    const resolvedLessonTitle = typeof lessonTitle === "string" && lessonTitle.trim()
      ? lessonTitle.trim()
      : Array.isArray(lessonTitles) && lessonTitles.length === 1 && typeof lessonTitles[0] === "string"
        ? lessonTitles[0].trim()
        : "";

    if (!moduleTitle || !resolvedLessonTitle) {
      throw new Error("moduleTitle and lessonTitle are required");
    }

    // Return a stub — no AI call. Creators write their own content.
    const result = {
      lessons: [
        {
          title: resolvedLessonTitle,
          description: `Add your content for "${resolvedLessonTitle}" here.`,
          content: "",
          assignment: "",
        },
      ],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-lesson-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
