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
  console.log(`[CREATE-COURSE-CHECKOUT] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("User not authenticated");

    const user = userData.user;
    logStep("User authenticated", { email: user.email });

    // Parse body
    const body = await req.json().catch(() => ({}));
    const courseId = body.course_id;
    if (!courseId) throw new Error("course_id is required");
    logStep("Course ID", { courseId });

    // Fetch course details
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("id, title, price_cents, currency, is_free, user_id, slug, stripe_account_id")
      .eq("id", courseId)
      .is("deleted_at", null)
      .single();

    if (courseError || !course) throw new Error("Course not found");
    if (course.is_free || !course.price_cents || course.price_cents <= 0) {
      throw new Error("This course is free — no payment needed");
    }

    logStep("Course found", { title: course.title, price_cents: course.price_cents });

    // Get creator's Stripe Connect account
    const { data: creatorProfile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", course.user_id)
      .single();

    const creatorStripeId = course.stripe_account_id || creatorProfile?.stripe_account_id;

    if (!creatorStripeId || !creatorProfile?.stripe_onboarding_complete) {
      throw new Error("Creator has not connected their Stripe account yet");
    }

    logStep("Creator Stripe account", { creatorStripeId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if buyer already has a Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Check if already enrolled
    const { data: existing } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("course_id", courseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      throw new Error("You are already enrolled in this course");
    }

    // Calculate Excellion 2% platform fee
    const applicationFeeAmount = Math.round(course.price_cents * 0.02);
    logStep("Fee calculation", {
      price_cents: course.price_cents,
      application_fee: applicationFeeAmount,
      creator_receives: course.price_cents - applicationFeeAmount,
    });

    const origin = req.headers.get("origin") || "https://excellioncourses.lovable.app";

    // Create checkout session with Connect destination charge
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      line_items: [
        {
          price_data: {
            currency: (course.currency || "usd").toLowerCase(),
            product_data: {
              name: course.title,
              description: `One-time purchase for "${course.title}"`,
            },
            unit_amount: course.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: creatorStripeId,
        },
      },
      success_url: `${origin}/purchase-success?session_id={CHECKOUT_SESSION_ID}&course_id=${courseId}`,
      cancel_url: `${origin}/course/${course.slug || courseId}`,
      metadata: {
        user_id: user.id,
        course_id: courseId,
        type: "course_purchase",
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url }),
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
