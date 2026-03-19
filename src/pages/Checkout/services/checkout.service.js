import { supabase } from "../../../lib/supabase";

export async function loadStoreSettingsService() {
  const { data, error } = await supabase
    .from("store_settings")
    .select("delivery_fee, estimated_delivery_time")
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data ?? null;
}

export async function createOrderService(orderPayload) {
  const { data, error } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function createOrderItemsService(itemsPayload) {
  const { error } = await supabase.from("order_items").insert(itemsPayload);

  if (error) throw error;
}

export async function deleteOrderService(orderId) {
  const { error } = await supabase.from("orders").delete().eq("id", orderId);

  if (error) throw error;
}

export async function createOnlineCheckoutSessionService(payload) {
  const { data, error } = await supabase.functions.invoke(
    "create-checkout-session",
    {
      body: payload,
    }
  );

  if (error) throw error;

  if (!data?.url) {
    throw new Error("A sessão de pagamento não retornou uma URL.");
  }

  return data;
}