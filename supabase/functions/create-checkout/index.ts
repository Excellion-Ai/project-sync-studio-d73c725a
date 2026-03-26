import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${d}`);
};

// Price IDs
const PRICES = {
  waitlist_monthly: "price_1TF4uLPCTHzXvqDgXzsHLUoV", // $49/mo (locked forever for waitlist)
  public_monthly: "price_1T1YnuPCTHzXvqDgZwElpsRS",   // $79/mo (public after month 1)
  annual: "price_1T1YjxPCTHzXvqDg3Plq3gtT",           // $790/yr
};

// Stripe coupon IDs (first-month discounts)
const COUPONS = {
  waitlist_first_month: "VsiCmzhh", // $30 off → $49 - $30 = $19 first month
  public_first_month: "YqRziFUU",  // $50 off → $79 - $50 = $29 first month
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

    // Service-role client for waitlist lookup (waitlist table has no SELECT RLS for users)
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
    const plan = body.plan || "monthly"; // "monthly" or "annual"
    logStep("Plan requested", { plan });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if user is on the waitlist
    const { data: waitlistEntry } = await supabaseAdmin
      .from("waitlist")
      .select("id")
      .eq("email", user.email)
      .limit(1)
      .maybeSingle();

    const isWaitlist = !!waitlistEntry;
    logStep("Waitlist check", { isWaitlist });

    // Select price and coupon
    let priceId: string;
    let couponId: string | undefined;

    if (plan === "annual") {
      priceId = PRICES.annual;
      couponId = undefined; // No first-month discount on annual
    } else if (isWaitlist) {
      priceId = PRICES.waitlist_monthly;
      couponId = COUPONS.waitlist_first_month;
    } else {
      priceId = PRICES.public_monthly;
      couponId = COUPONS.public_first_month;
    }

    logStep("Price selected", { priceId, couponId });

    // Find or reference existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://excellioncourses.lovable.app";

    // Build checkout session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        user_id: user.id,
        is_waitlist: isWaitlist ? "true" : "false",
        plan,
      },
    };

    // Apply coupon for first-month discount
    if (couponId) {
      sessionParams.discounts = [{ coupon: couponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
