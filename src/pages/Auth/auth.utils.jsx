export function normalizeSpaces(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function formatCep(value) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export function validateRegisterForm(form) {
  const errors = {};

  const name = normalizeSpaces(form.name);
  const email = String(form.email || "").trim().toLowerCase();
  const password = form.password;
  const phoneDigits = onlyDigits(form.phone);
  const cepDigits = onlyDigits(form.cep);
  const address = normalizeSpaces(form.address);
  const district = normalizeSpaces(form.district);
  const city = normalizeSpaces(form.city);
  const state = String(form.state || "").trim().toUpperCase();
  const number = normalizeSpaces(form.number);

  if (!name || name.length < 3) {
    errors.name = "Informe um nome com pelo menos 3 caracteres.";
  }

  if (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 11) {
    errors.phone = "Informe um telefone válido com DDD.";
  }

  if (form.cep && cepDigits.length !== 8) {
    errors.cep = "O CEP deve ter 8 números.";
  }

  if (!address || address.length < 3) {
    errors.address = "Informe um endereço válido.";
  }

  if (!district || district.length < 2) {
    errors.district = "Informe o bairro.";
  }

  if (!city || city.length < 2) {
    errors.city = "Informe a cidade.";
  }

  if (!state || state.length !== 2) {
    errors.state = "Informe a UF com 2 letras.";
  }

  if (!number || number.length < 1) {
    errors.number = "Informe o número do endereço.";
  }

  if (!email || !validateEmail(email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!password || password.length < 6) {
    errors.password = "A senha deve ter pelo menos 6 caracteres.";
  }

  return errors;
}

export function validateLoginForm(form) {
  const errors = {};

  if (!String(form.email || "").trim() || !validateEmail(form.email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!form.password || form.password.length < 6) {
    errors.password = "Informe sua senha corretamente.";
  }

  return errors;
}