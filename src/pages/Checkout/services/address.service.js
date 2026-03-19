import { supabase } from "../../../lib/supabase";

export async function fetchAddressByCepService(cep) {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

  if (!response.ok) {
    throw new Error("Falha ao consultar o CEP.");
  }

  const data = await response.json();

  if (data.erro) {
    throw new Error("CEP não encontrado.");
  }

  return data;
}

export async function geocodeAddressService(address, signal) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(
      address
    )}`,
    {
      signal,
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Falha ao localizar endereço.");
  }

  return response.json();
}

export async function geocodeCepFallbackService(cep, signal) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&postalcode=${cep}&country=Brazil`,
    {
      signal,
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Falha ao localizar CEP.");
  }

  return response.json();
}

export async function loadAddressesService(userId) {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function saveAddressService(payload) {
  const { error } = await supabase.from("addresses").insert(payload);
  if (error) throw error;
}

export async function deleteAddressService(userId, addressId) {
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateAddressCoordinatesService({
  userId,
  addressId,
  latitude,
  longitude,
}) {
  const { error } = await supabase
    .from("addresses")
    .update({
      latitude,
      longitude,
    })
    .eq("id", addressId)
    .eq("user_id", userId);

  if (error) throw error;
}