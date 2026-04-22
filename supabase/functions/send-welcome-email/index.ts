import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ["https://excellioncourses.com", "https://www.excellioncourses.com"];
  const isAllowed =
    allowed.includes(origin) ||
    origin.endsWith(".lovable.app") ||
    origin.endsWith(".lovableproject.com");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowed[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  const cors = getCorsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();
    const { user_id, email, first_name } = body;

    // ── Validate inputs ───────────────────────────────────
    if (!user_id || !UUID_RE.test(user_id)) {
      return json({ error: "user_id must be a valid UUID" }, 400);
    }
    if (!email || !EMAIL_RE.test(email)) {
      return json({ error: "email must be a valid email address" }, 400);
    }

    console.log("[welcome-email] processing", { user_id, email });

    // ── Idempotency check ─────────────────────────────────
    const { data: existing } = await supabase
      .from("email_log")
      .select("id")
      .eq("user_id", user_id)
      .eq("email_type", "welcome")
      .limit(1);

    if (existing && existing.length > 0) {
      console.log("[welcome-email] already sent, skipping");
      return json({ sent: false, skipped: true, reason: "already_sent" });
    }

    // ── Global rate limit (5 welcome emails per hour) ─────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("email_log")
      .select("*", { count: "exact", head: true })
      .eq("email_type", "welcome")
      .gte("sent_at", oneHourAgo);

    if ((count ?? 0) >= 5) {
      console.warn("[welcome-email] rate limited, count:", count);
      await supabase.from("email_log").insert({
        user_id,
        email_address: email,
        email_type: "welcome",
        status: "failed",
        error_message: "Global rate limit exceeded (5/hour)",
      });
      return json({ sent: false, skipped: true, reason: "rate_limited" });
    }

    // ── Build email ───────────────────────────────────────
    const name = first_name?.trim() || "there";
    const subject =
      "Your Excellion account is live. Here's what to build first.";

    const htmlBody = `<!DOCTYPE html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
<p>Hi ${name},</p>

<p>Welcome to Excellion. You just joined the first wave of fitness coaches skipping Kajabi and building on their own domain.</p>

<p>Here's how to get your first course live in the next 15 minutes:</p>

<p><strong>1. Pick your audience.</strong> Busy moms, powerlifters, bodybuilders, beginners, whoever you train. Don't overthink it.</p>

<p><strong>2. Drop in your expertise.</strong> Type a few sentences about what you teach. If you have a PDF of a program you've written, upload it. Excellion will use that as the foundation.</p>

<p><strong>3. Hit generate.</strong> In 60 seconds you'll have a full course outline, lesson plan, and sales page. Edit anything. It's yours.</p>

<p><a href="https://excellioncourses.com/studio" style="display: inline-block; padding: 12px 24px; background: #C9A84C; color: #000; text-decoration: none; border-radius: 8px; font-weight: 600;">Go build</a></p>

<p>Questions? Reply to this email. I read every one.</p>

<p>John<br>Founder, Excellion</p>
</body></html>`;

    const textBody = `Hi ${name},

Welcome to Excellion. You just joined the first wave of fitness coaches skipping Kajabi and building on their own domain.

Here's how to get your first course live in the next 15 minutes:

1. Pick your audience. Busy moms, powerlifters, bodybuilders, beginners, whoever you train. Don't overthink it.

2. Drop in your expertise. Type a few sentences about what you teach. If you have a PDF of a program you've written, upload it. Excellion will use that as the foundation.

3. Hit generate. In 60 seconds you'll have a full course outline, lesson plan, and sales page. Edit anything. It's yours.

Go build: https://excellioncourses.com/studio

Questions? Reply to this email. I read every one.

John
Founder, Excellion`;

    // ── Send via Resend ───────────────────────────────────
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "John from Excellion <hello@excellioncourses.com>",
        reply_to: "johnlewton3@gmail.com",
        to: [email],
        subject,
        html: htmlBody,
        text: textBody,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      const errMsg =
        resendData?.message || resendData?.error || JSON.stringify(resendData);
      console.error("[welcome-email] Resend API error:", errMsg);

      const { data: logRow } = await supabase
        .from("email_log")
        .insert({
          user_id,
          email_address: email,
          email_type: "welcome",
          subject,
          status: "failed",
          error_message: errMsg,
        })
        .select("id")
        .single();

      return json({ sent: false, email_log_id: logRow?.id, error: errMsg }, 502);
    }

    // ── Log success ───────────────────────────────────────
    console.log("[welcome-email] sent, resend id:", resendData.id);

    const { data: logRow } = await supabase
      .from("email_log")
      .insert({
        user_id,
        email_address: email,
        email_type: "welcome",
        subject,
        status: "sent",
        resend_id: resendData.id,
      })
      .select("id")
      .single();

    return json({
      sent: true,
      email_log_id: logRow?.id,
      resend_id: resendData.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[welcome-email] error:", msg);
    return json({ error: msg }, 500);
  }
});
