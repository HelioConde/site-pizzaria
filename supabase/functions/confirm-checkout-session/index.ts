// REVIEW CANDIDATE. Deploy only as part of a staged checkout migration with
// server-side create-checkout-session, RLS policy changes and integration tests.
// The paid Stripe session and its line items—not client checkoutPayload—are
// authoritative for monetary totals and product identities.
import Stripe from "https://esm.sh/stripe@18.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

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
const value = (input: unknown, size = 240) =>
  typeof input === "string" ? input.trim().slice(0, size) : "";
const phoneDigits = (input: unknown) => String(input ?? "").replace(/\D/g, "");
const optionalNumber = (input: unknown) => {
  if (input == null || input === "") return null;
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!stripeKey || !supabaseUrl || !serviceKey) return json({ error: "Serviço indisponível." }, 503);

    const body = await req.json();
    const sessionId = value(body?.sessionId, 240);
    const checkoutToken = value(body?.checkoutToken, 120);
    if (!sessionId || !checkoutToken) return json({ error: "Identificação do pagamento ausente." }, 400);

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.checkout_token !== checkoutToken) {
      return json({ error: "Sessão de pagamento não autorizada." }, 403);
    }
    if (session.status !== "complete" || session.payment_status !== "paid") {
      return json({
        success: false,
        paid: false,
        message: "Pagamento ainda não foi concluído no Stripe.",
        stripeStatus: session.status,
        stripePaymentStatus: session.payment_status,
      });
    }

    const { data: existing, error: existingError } = await supabase
      .from("orders").select("*").eq("stripe_session_id", sessionId)
      .order("created_at", { ascending: false }).limit(1);
    if (existingError) throw existingError;
    if (existing?.length) return json({ success: true, paid: true, order: existing[0] });

    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
      expand: ["data.price.product"],
    });
    if (lineItems.has_more || !lineItems.data.length) throw new Error("Itens Stripe incompletos.");

    const orderItems: {
      product_id: string; name: string; quantity: number; unit_price: number;
      notes: string | null; removed_ingredients: string[] | null;
    }[] = [];
    let subtotalCents = 0;
    let deliveryFeeCents = 0;

    for (const line of lineItems.data) {
      const product = line.price?.product;
      if (!product || typeof product === "string" || !("metadata" in product)) {
        throw new Error("Dados originais do item Stripe ausentes.");
      }
      const meta = product.metadata ?? {};
      const qty = Number(line.quantity ?? 0);
      const unitCents = Number(line.price?.unit_amount ?? -1);
      if (!Number.isSafeInteger(qty) || qty < 1 || qty > 99 ||
          !Number.isSafeInteger(unitCents) || unitCents < 1) {
        throw new Error("Quantidade ou valor Stripe inválidos.");
      }
      const lineCents = qty * unitCents;
      if (!Number.isSafeInteger(lineCents)) throw new Error("Valor excedido.");

      if (meta.line_type === "delivery_fee") {
        deliveryFeeCents += lineCents;
        continue;
      }

      const productId = value(meta.product_id, 50);
      if (!productId) throw new Error("Identificação original do produto ausente.");
      const notes = value(meta.notes, 220) || null;
      const ingredients = value(meta.removed_ingredients, 450).split(",")
        .map((part) => part.trim()).filter(Boolean).slice(0, 20);
      orderItems.push({
        product_id: productId,
        name: value(product.name, 160),
        quantity: qty,
        unit_price: unitCents / 100,
        notes,
        removed_ingredients: ingredients.length ? ingredients : null,
      });
      subtotalCents += lineCents;
    }
    const totalCents = subtotalCents + deliveryFeeCents;
    if (!orderItems.length || !Number.isSafeInteger(totalCents) ||
        totalCents !== session.amount_total ||
        String(totalCents) !== session.metadata?.canonical_total_cents) {
      throw new Error("Valor da sessão não confere com os itens pagos.");
    }

    const meta = session.metadata ?? {};
    const mode = value(meta.mode, 30) === "account" ? "account" : "guest";
    let authenticatedId: string | null = null;
    if (mode === "account") {
      const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
      if (!jwt) return json({ error: "Faça login para confirmar este pedido." }, 401);
      const { data, error } = await supabase.auth.getUser(jwt);
      if (error || !data.user) return json({ error: "Sessão do usuário inválida." }, 401);
      authenticatedId = data.user.id;
    }

    const customerName = value(meta.customer_name, 120);
    const customerPhone = phoneDigits(meta.customer_phone);
    if (!customerName || customerPhone.length < 10) throw new Error("Cliente original inválido.");

    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent : session.payment_intent?.id ?? null;

    const { data: order, error: orderError } = await supabase.from("orders").insert({
      user_id: authenticatedId,
      payment_method: "pagamento_online",
      payment_status: "paid",
      order_status: "pending",
      is_test_order: mode === "guest",
      stripe_session_id: session.id,
      payment_intent_id: paymentIntentId,
      subtotal: subtotalCents / 100,
      delivery_fee: deliveryFeeCents / 100,
      total: totalCents / 100,
      customer_name: customerName,
      customer_email: value(session.customer_email, 250) || null,
      customer_phone: customerPhone,
      delivery_cep: value(meta.delivery_cep, 8) || null,
      delivery_address: value(meta.delivery_address, 200) || null,
      delivery_district: value(meta.delivery_district, 120) || null,
      delivery_city: value(meta.delivery_city, 80) || null,
      delivery_state: value(meta.delivery_state, 10) || null,
      delivery_number: value(meta.delivery_number, 30) || null,
      delivery_complement: value(meta.delivery_complement, 180) || null,
      delivery_reference: value(meta.delivery_reference, 180) || null,
      delivery_lat: optionalNumber(meta.delivery_lat),
      delivery_lng: optionalNumber(meta.delivery_lng),
      notes: "Pedido criado a partir dos itens pagos e confirmados pelo Stripe.",
    }).select("*").single();

    if (orderError) throw orderError;
    const { error: itemsError } = await supabase.from("order_items")
      .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));
    if (itemsError) {
      console.error("Pedido pago criado sem todos os itens; requer reconciliação:", order.id, itemsError);
      return json({ error: "Pagamento confirmado; pedido em processamento. Contate o suporte." }, 503);
    }

    // Stripe metadata is helpful for webhooks but is not an atomic transaction.
    try {
      await stripe.checkout.sessions.update(sessionId, {
        metadata: { ...session.metadata, order_id: String(order.id) },
      });
    } catch (error) {
      console.error("Não foi possível gravar order_id na sessão Stripe:", error);
    }
    return json({ success: true, paid: true, order });
  } catch (error) {
    console.error("Falha ao confirmar checkout Stripe:", error);
    return json({ error: "Não foi possível confirmar este pagamento. Contate o suporte." }, 500);
  }
});
