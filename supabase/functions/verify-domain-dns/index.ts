import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { domain, courseId } = await req.json();
    if (!domain || !courseId) {
      return new Response(JSON.stringify({ error: "domain and courseId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user owns this course
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: course } = await serviceClient
      .from("courses")
      .select("id, user_id, custom_domain")
      .eq("id", courseId)
      .single();

    if (!course || course.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Course not found or not owned by you" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean domain input
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase().trim();
    const expectedTxt = `excellion=${courseId.slice(0, 8)}`;

    // Verify DNS records using Cloudflare DoH (public, no API key needed)
    let txtVerified = false;
    let aVerified = false;

    // Check TXT record: _verify.{domain}
    try {
      const txtRes = await fetch(
        `https://cloudflare-dns.com/dns-query?name=_verify.${cleanDomain}&type=TXT`,
        { headers: { Accept: "application/dns-json" } },
      );
      const txtData = await txtRes.json();
      const answers = txtData.Answer || [];
      txtVerified = answers.some((a: any) => {
        const val = (a.data || "").replace(/"/g, "").trim();
        return val === expectedTxt;
      });
    } catch (e) {
      console.warn("TXT lookup failed:", e);
    }

    // Check A record
    try {
      const aRes = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=A`,
        { headers: { Accept: "application/dns-json" } },
      );
      const aData = await aRes.json();
      const answers = aData.Answer || [];
      aVerified = answers.some((a: any) => a.data === "185.158.133.1");
    } catch (e) {
      console.warn("A record lookup failed:", e);
    }

    const verified = txtVerified && aVerified;

    // Update domain_verified in courses table
    if (verified) {
      await serviceClient
        .from("courses")
        .update({ domain_verified: true, updated_at: new Date().toISOString() })
        .eq("id", courseId);
    }

    return new Response(
      JSON.stringify({
        verified,
        txtVerified,
        aVerified,
        domain: cleanDomain,
        expectedTxt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("verify-domain-dns error:", err);
    return new Response(
      JSON.stringify({ error: "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
