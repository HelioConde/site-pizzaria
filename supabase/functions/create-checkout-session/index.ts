// REVIEW CANDIDATE: do not deploy until confirm-checkout-session and guest RLS are
// hardened together and Stripe sandbox / database integration tests pass.
// Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY,
// and optionally CHECKOUT_RETURN_BASE_URL (defaults to published GitHub Pages URL).
import Stripe from "https://esm.sh/stripe@18.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { calculateServerCheckout, verifyClientTotals } from "../_shared/checkoutPricing.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const str = (value: unknown, max = 200) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const digits = (value: unknown) => String(value ?? "").replace(/\D/g, "");
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function verifyReturnUrl(url: string, route: string) {
  const base = new URL(Deno.env.get("CHECKOUT_RETURN_BASE_URL") ||
    "https://helioconde.github.io/site-pizzaria/");
  if (!base.pathname.endsWith("/")) base.pathname += "/";
  const target = new URL(url);
  if (target.protocol !== "https:" && target.hostname !== "localhost") {
    throw new Error("URL de retorno inválida.");
  }
  if (target.origin !== base.origin || target.pathname !== `${base.pathname}${route}`) {
    throw new Error("URL de retorno não autorizada.");
  }
  return target.href;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!stripeKey || !supabaseUrl || !serviceKey) {
      console.error("Segredos obrigatórios de checkout não configurados.");
      return json({ error: "Checkout temporariamente indisponível." }, 503);
    }

    const body = await req.json();
    const requestedItems = body?.cartItems;
    if (!Array.isArray(requestedItems) || !requestedItems.length || requestedItems.length > 100) {
      throw new Error("Carrinho inválido.");
    }

    const productIds = [...new Set(requestedItems.map((item: { productId?: string }) =>
      String(item?.productId ?? "").trim(),
    ))];
    if (productIds.some((id) => !uuidPattern.test(id))) {
      throw new Error("Referência de produto inválida.");
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [productsResult, settingsResult] = await Promise.all([
      supabase.from("products").select("id,name,price,is_active").in("id", productIds),
      supabase.from("store_settings").select("delivery_fee").limit(1).maybeSingle(),
    ]);
    if (productsResult.error || settingsResult.error || !settingsResult.data) {
      console.error("Erro ao consultar preços ou frete no servidor.");
      return json({ error: "Não foi possível confirmar o cardápio. Tente novamente." }, 503);
    }

    const canonical = calculateServerCheckout(
      requestedItems,
      productsResult.data ?? [],
      settingsResult.data.delivery_fee,
    );
    verifyClientTotals(body, canonical);

    const customerName = str(body?.customer?.name, 120);
    const customerEmail = str(body?.customer?.email, 250);
    const customerPhone = digits(body?.customer?.phone);
    const checkoutToken = str(body?.checkoutToken, 120);
    if (!customerName || customerPhone.length < 10 || !checkoutToken) {
      throw new Error("Dados do pedido incompletos.");
    }

    const successUrl = verifyReturnUrl(str(body?.successUrl, 1000), "payment-online-check");
    const cancelUrl = verifyReturnUrl(str(body?.cancelUrl, 1000), "checkout");
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = canonical.items.map((item) => {
      const description = [
        item.notes && `Obs: ${item.notes}`,
        item.removedIngredients.length && `Remover: ${item.removedIngredients.join(", ")}`,
      ].filter(Boolean).join(" | ");
      return {
        price_data: {
          currency: "brl",
          product_data: { name: item.name, description: description || undefined },
          unit_amount: item.unitPriceCents,
        },
        quantity: item.quantity,
      };
    });

    if (canonical.deliveryFeeCents > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: { name: "Taxa de entrega" },
          unit_amount: canonical.deliveryFeeCents,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail || undefined,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_types: ["card"],
      metadata: {
        checkout_token: checkoutToken,
        mode: str(body?.mode, 50),
        customer_name: customerName,
        customer_phone: customerPhone.slice(0, 30),
        // Confirming a paid order must compare against the Stripe amount and a
        // SERVER-PERSISTED item snapshot, not caller-controlled checkoutPayload.
        canonical_total_cents: String(canonical.totalCents),
        delivery_address: `${str(body?.delivery?.address)}, ${str(body?.delivery?.number)}`.slice(0, 200),
        delivery_city: str(body?.delivery?.city, 80),
        delivery_state: str(body?.delivery?.state, 10),
      },
    });

    return json({
      id: session.id,
      sessionId: session.id,
      paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout input rejected or provider unavailable:", error);
    return json({
      error: error instanceof Error ? error.message : "Não foi possível iniciar o pagamento.",
    }, 400);
  }
});
