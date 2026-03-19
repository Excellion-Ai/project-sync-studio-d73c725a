import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email } = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📧 [waitlist-welcome] Sending welcome email to ${email}`);

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;border:1px solid #222;">
          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 20px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#d4a853;letter-spacing:-0.5px;">
                Excellion
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 40px 20px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#ffffff;">
                You're on the list!
              </h2>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#9ca3af;">
                Thanks for joining the Excellion early access waitlist. You're one step closer to launching your fitness course with AI — fast, professional, and built for creators like you.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#9ca3af;">
                We're launching <strong style="color:#ffffff;">April 7th</strong>. As an early access member, you'll be first in line to:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:6px 0;font-size:15px;color:#d4a853;">•</td>
                  <td style="padding:6px 0 6px 12px;font-size:15px;color:#9ca3af;">Generate full courses in under 60 seconds</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:15px;color:#d4a853;">•</td>
                  <td style="padding:6px 0 6px 12px;font-size:15px;color:#9ca3af;">Publish and sell with zero tech skills required</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:15px;color:#d4a853;">•</td>
                  <td style="padding:6px 0 6px 12px;font-size:15px;color:#9ca3af;">Lock in exclusive early access pricing forever</td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#9ca3af;">
                We'll send you everything you need before launch day. Get ready.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 40px;border-top:1px solid #222;text-align:center;">
              <p style="margin:0;font-size:13px;color:#555;">
                © 2026 Excellion. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Excellion <hello@excellioncourses.com>",
        to: [email],
        subject: "You're on the Excellion waitlist 🎉",
        html: htmlBody,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("❌ [waitlist-welcome] Resend error:", JSON.stringify(resendData));
      throw new Error(`Resend API error: ${resendResponse.status} — ${JSON.stringify(resendData)}`);
    }

    console.log("✅ [waitlist-welcome] Email sent:", resendData.id);

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("❌ [waitlist-welcome] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
