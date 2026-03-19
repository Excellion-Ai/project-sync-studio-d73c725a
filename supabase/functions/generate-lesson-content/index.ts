import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// This function is now a LIGHTWEIGHT helper — it generates a brief description
// for a lesson, NOT full content. Creators add their own content.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-lesson-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
