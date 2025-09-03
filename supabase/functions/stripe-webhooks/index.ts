import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOKS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role key for database writes
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY_LIVE");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY_LIVE is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    // Note: In production, you should set STRIPE_WEBHOOK_SECRET
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err });
        return new Response("Webhook signature verification failed", { status: 400 });
      }
    } else {
      // For development, parse the event directly (not recommended for production)
      event = JSON.parse(body);
    }

    logStep("Processing event", { type: event.type, id: event.id });

    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription && invoice.customer) {
          const customer = await stripe.customers.retrieve(invoice.customer as string);
          
          if (customer && !customer.deleted && customer.email) {
            logStep("Payment succeeded", { 
              customerEmail: customer.email, 
              subscriptionId: invoice.subscription 
            });

            // Update subscriber status to active
            await supabaseClient.from("subscribers").upsert({
              email: customer.email,
              stripe_customer_id: customer.id,
              subscribed: true,
              subscription_tier: "Premium",
              subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              updated_at: new Date().toISOString(),
            }, { onConflict: 'email' });

            logStep("Updated subscription status to active", { email: customer.email });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if (customer && !customer.deleted && customer.email) {
          logStep("Subscription deleted", { 
            customerEmail: customer.email, 
            subscriptionId: subscription.id 
          });

          // Update subscriber status to inactive
          await supabaseClient.from("subscribers").upsert({
            email: customer.email,
            stripe_customer_id: customer.id,
            subscribed: false,
            subscription_tier: null,
            subscription_end: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });

          logStep("Updated subscription status to inactive", { email: customer.email });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if (customer && !customer.deleted && customer.email) {
          const isActive = subscription.status === "active";
          const subscriptionEnd = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          logStep("Subscription updated", { 
            customerEmail: customer.email, 
            status: subscription.status,
            isActive 
          });

          await supabaseClient.from("subscribers").upsert({
            email: customer.email,
            stripe_customer_id: customer.id,
            subscribed: isActive,
            subscription_tier: isActive ? "Premium" : null,
            subscription_end: subscriptionEnd,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });

          logStep("Updated subscription status", { email: customer.email, isActive });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhooks", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});