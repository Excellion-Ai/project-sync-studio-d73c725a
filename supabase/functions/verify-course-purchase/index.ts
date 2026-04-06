import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-COURSE-PURCHASE] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const body = await req.json().catch(() => ({}));
    const sessionId = body.session_id;
    const courseId = body.course_id;
    if (!sessionId) throw new Error("session_id is required");
    if (!courseId) throw new Error("course_id is required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { status: session.payment_status, mode: session.mode });

    if (session.payment_status !== "paid") {
      throw new Error("Payment has not been completed");
    }

    // Verify this session belongs to this user
    if (session.client_reference_id !== user.id) {
      throw new Error("This payment does not belong to you");
    }

    // Verify metadata matches
    if (session.metadata?.course_id !== courseId) {
      throw new Error("Course ID mismatch");
    }

    // Check if purchase already recorded
    const { data: existingPurchase } = await supabaseAdmin
      .from("purchases")
      .select("id")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();

    if (existingPurchase) {
      logStep("Purchase already recorded, returning success");
      // Check enrollment exists too
      const { data: enrollment } = await supabaseAdmin
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({ success: true, already_processed: true, enrollment_id: enrollment?.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get course details for the purchase record
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("price_cents, currency, slug")
      .eq("id", courseId)
      .single();

    // Insert purchase record (uses service_role to bypass deny-all RLS)
    const { error: purchaseError } = await supabaseAdmin
      .from("purchases")
      .insert({
        user_id: user.id,
        course_id: courseId,
        amount_cents: course?.price_cents || (session.amount_total ?? 0),
        currency: course?.currency || "usd",
        stripe_checkout_session_id: sessionId,
        stripe_payment_intent_id: session.payment_intent as string,
        status: "paid",
      });

    if (purchaseError) {
      logStep("Failed to insert purchase", { error: purchaseError });
      throw new Error("Failed to record purchase");
    }
    logStep("Purchase recorded");

    // Create enrollment (uses service_role to bypass free-course-only RLS)
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from("enrollments")
      .insert({
        course_id: courseId,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (enrollError) {
      // Might already be enrolled (race condition)
      if (enrollError.code === "23505") {
        logStep("Already enrolled (duplicate)");
      } else {
        logStep("Failed to create enrollment", { error: enrollError });
        throw new Error("Failed to create enrollment");
      }
    } else {
      logStep("Enrollment created", { enrollmentId: enrollment.id });
    }

    // Increment total_students
    await supabaseAdmin.rpc("generate_clean_slug", { title: "dummy" }).then(() => {});
    // Direct update since we have service_role
    await supabaseAdmin
      .from("courses")
      .update({ total_students: (course as any)?.total_students ? (course as any).total_students + 1 : 1 })
      .eq("id", courseId);

    return new Response(
      JSON.stringify({
        success: true,
        enrollment_id: enrollment?.id,
        course_slug: course?.slug,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
