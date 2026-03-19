import { supabase } from "../../lib/supabase";
import { USER_ROLE } from "./auth.constants";

export async function getProfileRole(userId) {
  if (!userId) {
    return USER_ROLE.CUSTOMER;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return String(data?.role || USER_ROLE.CUSTOMER).trim().toLowerCase();
}

export function getRedirectByRole(role, fallbackPath) {
  if (role === USER_ROLE.ADMIN) {
    return "/admin/dashboard";
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

  if (!response.ok) {
    throw new Error("Não foi possível consultar o CEP no momento.");
  }

  const data = await response.json();

  if (data?.erro) {
    throw new Error("CEP não encontrado.");
  }

  return data;
}

export function mapAuthErrorMessage(error, fallbackMessage) {
  const rawMessage = String(
    error?.message || error?.error_description || error?.msg || ""
  )
    .trim()
    .toLowerCase();

  if (!rawMessage) {
    return fallbackMessage || "Ocorreu um erro inesperado. Tente novamente.";
  }

  if (
    rawMessage.includes("user already registered") ||
    rawMessage.includes("already registered") ||
    rawMessage.includes("already been registered")
  ) {
    return "Este e-mail já está cadastrado. Tente entrar na sua conta.";
  }

  if (
    rawMessage.includes("invalid login credentials") ||
    rawMessage.includes("email not confirmed")
  ) {
    return "E-mail ou senha incorretos.";
  }

  if (
    rawMessage.includes("password should be at least") ||
    rawMessage.includes("password must be at least")
  ) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  if (
    rawMessage.includes("unable to validate email address") ||
    rawMessage.includes("email address is invalid") ||
    rawMessage.includes("invalid email")
  ) {
    return "Informe um e-mail válido.";
  }

  if (
    rawMessage.includes("signup is disabled") ||
    rawMessage.includes("signups not allowed")
  ) {
    return "O cadastro está temporariamente indisponível.";
  }

  if (
    rawMessage.includes("too many requests") ||
    rawMessage.includes("over_email_send_rate_limit")
  ) {
    return "Muitas tentativas realizadas. Aguarde um momento e tente novamente.";
  }

  if (
    rawMessage.includes("network request failed") ||
    rawMessage.includes("failed to fetch")
  ) {
    return "Falha de conexão. Verifique sua internet e tente novamente.";
  }

  return fallbackMessage || "Não foi possível concluir a operação no momento.";
}

export function logAuthError(context, error, extra = {}) {
  console.error(`[Auth] ${context}`, {
    mensagem: error?.message || null,
    codigo: error?.code || null,
    status: error?.status || null,
    nome: error?.name || null,
    detalhes: error?.details || null,
    extra,
  });
}