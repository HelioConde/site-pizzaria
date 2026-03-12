import { supabase } from "../../lib/supabase";
import { USER_ROLE } from "./auth.constants";

export async function getProfileRole(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  console.log("getProfileRole userId:", userId);
  console.log("getProfileRole data:", data);
  console.log("getProfileRole error:", error);

  if (error) {
    throw error;
  }

  return String(data?.role || USER_ROLE.CUSTOMER).trim().toLowerCase();
}

export function getRedirectByRole(role, fallbackPath) {
  if (role === USER_ROLE.ADMIN) {
    return "/admin";
  }

  if (role === USER_ROLE.DELIVERY) {
    return "/motoboy";
  }

  return fallbackPath || "/account";
}

export async function fetchAddressByCep(rawCep) {
  const cep = String(rawCep || "").replace(/\D/g, "");

  if (cep.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data = await response.json();

  if (data.erro) {
    throw new Error("CEP não encontrado.");
  }

  return data;
}