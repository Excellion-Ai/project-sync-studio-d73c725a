import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400, headers: corsHeaders });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Webhook signature verification failed:", msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400, headers: corsHeaders });
  }

  // Service role client to bypass RLS
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription && session.client_reference_id) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertSubscription(supabase, sub, session.client_reference_id);
        }
        // Handle course purchases (one-time payments)
        if (session.mode === "payment" && session.metadata?.type === "course_purchase" && session.payment_status === "paid") {
          const userId = session.client_reference_id || session.metadata?.user_id;
          const courseId = session.metadata?.course_id;
          if (userId && courseId) {
            // Insert purchase (idempotent — skip if already exists)
            const { data: existingPurchase } = await supabase
              .from("purchases")
              .select("id")
              .eq("stripe_checkout_session_id", session.id)
              .maybeSingle();

            if (!existingPurchase) {
              await supabase.from("purchases").insert({
                user_id: userId,
                course_id: courseId,
                amount_cents: session.amount_total ?? 0,
                currency: session.currency || "usd",
                stripe_checkout_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent as string,
                status: "paid",
              });
            }

            // Create enrollment (idempotent)
            const { error: enrollErr } = await supabase
              .from("enrollments")
              .insert({ course_id: courseId, user_id: userId });
            if (enrollErr && enrollErr.code !== "23505") {
              console.error("Webhook: enrollment insert failed", enrollErr);
            }
            console.log(`[WEBHOOK] Course purchase fulfilled: user=${userId} course=${courseId}`);
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(supabase, sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", cancel_at_period_end: false })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await upsertSubscription(supabase, sub);
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// deno-lint-ignore no-explicit-any
async function upsertSubscription(
  supabase: any,
  sub: Stripe.Subscription,
  userId?: string,
) {
  // Try to find existing row to get user_id if not provided
  if (!userId) {
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle();
    userId = existing?.user_id;
  }

  if (!userId) {
    console.error("Cannot upsert subscription: no user_id found for", sub.id);
    return;
  }

  const item = sub.items.data[0];
  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        status: sub.status,
        plan_name: item?.price?.nickname ?? item?.price?.lookup_key ?? null,
        price_cents: item?.price?.unit_amount ?? null,
        currency: item?.price?.currency ?? "usd",
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      },
      { onConflict: "stripe_subscription_id" },
    );

  if (error) {
    console.error("Failed to upsert subscription:", error);
    throw error;
  }
}
