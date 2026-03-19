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
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isSuspiciousEmail(email) {
  const normalized = normalizeEmail(email);

  if (!normalized || !normalized.includes("@")) {
    return false;
  }

  const [localPart = "", domain = ""] = normalized.split("@");
  const domainParts = domain.split(".");
  const domainName = domainParts[0] || "";
  const domainExtension = domainParts[1] || "";

  const blockedExactEmails = new Set([
    "teste@teste.com",
    "test@test.com",
    "admin@admin.com",
    "user@user.com",
    "email@email.com",
    "123@123.com",
    "abc@abc.com",
    "qwe@qwe.com",
    "asd@asd.com",
    "example@example.com",
    "exemplo@exemplo.com",
  ]);

  if (blockedExactEmails.has(normalized)) {
    return true;
  }

  const suspiciousWords = new Set([
    "teste",
    "test",
    "admin",
    "user",
    "usuario",
    "email",
    "example",
    "exemplo",
    "abc",
    "qwe",
    "asd",
    "123",
    "1234",
    "000",
  ]);

  const isSameLocalAndDomain =
    localPart &&
    domainName &&
    localPart === domainName &&
    suspiciousWords.has(localPart);

  if (isSameLocalAndDomain) {
    return true;
  }

  const invalidDomains = new Set([
    "teste.com",
    "test.com",
    "admin.com",
    "email.com",
    "123.com",
    "abc.com",
    "qwe.com",
    "asd.com",
    "example.com",
    "exemplo.com",
  ]);

  if (invalidDomains.has(domain)) {
    return true;
  }

  if (!domainName || !domainExtension) {
    return true;
  }

  return false;
}

export function getPasswordStrength(password) {
  const value = String(password || "");
  let score = 0;

  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (value.length === 0) {
    return {
      score: 0,
      label: "Vazia",
      level: "empty",
    };
  }

  if (score <= 2) {
    return {
      score,
      label: "Fraca",
      level: "weak",
    };
  }

  if (score === 3 || score === 4) {
    return {
      score,
      label: "Média",
      level: "medium",
    };
  }

  return {
    score,
    label: "Forte",
    level: "strong",
  };
}

export function getPasswordChecklist(password) {
  const value = String(password || "");

  return [
    {
      key: "length",
      label: "Pelo menos 8 caracteres",
      valid: value.length >= 8,
    },
    {
      key: "upper",
      label: "Uma letra maiúscula",
      valid: /[A-Z]/.test(value),
    },
    {
      key: "lower",
      label: "Uma letra minúscula",
      valid: /[a-z]/.test(value),
    },
    {
      key: "number",
      label: "Um número",
      valid: /\d/.test(value),
    },
    {
      key: "symbol",
      label: "Um caractere especial",
      valid: /[^A-Za-z0-9]/.test(value),
    },
  ];
}

export function validateRegisterForm(form) {
  const errors = {};

  const name = normalizeSpaces(form?.name);
  const email = normalizeEmail(form?.email);
  const password = String(form?.password || "");
  const confirmPassword = String(form?.confirmPassword || "");
  const phoneDigits = onlyDigits(form?.phone);
  const cepDigits = onlyDigits(form?.cep);
  const address = normalizeSpaces(form?.address);
  const district = normalizeSpaces(form?.district);
  const city = normalizeSpaces(form?.city);
  const state = String(form?.state || "").trim().toUpperCase();
  const number = normalizeSpaces(form?.number);

  if (!name || name.length < 3) {
    errors.name = "Informe seu nome com pelo menos 3 caracteres.";
  }

  if (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 11) {
    errors.phone = "Informe um telefone válido com DDD.";
  }

  if (form?.cep && cepDigits.length !== 8) {
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

  if (!number) {
    errors.number = "Informe o número do endereço.";
  }

  if (!email || !validateEmail(email)) {
    errors.email = "Informe um e-mail válido.";
  } else if (isSuspiciousEmail(email)) {
    errors.email =
      "Informe um e-mail real. Evite endereços genéricos como teste@teste.com.";
  }

  const checklist = getPasswordChecklist(password);
  const strongEnough = checklist.every((item) => item.valid);

  if (!password) {
    errors.password = "Crie uma senha para continuar.";
  } else if (!strongEnough) {
    errors.password =
      "Use uma senha mais forte com 8+ caracteres, maiúscula, minúscula, número e símbolo.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirme sua senha.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "As senhas não coincidem.";
  }

  return errors;
}

export function validateLoginForm(form) {
  const errors = {};
  const email = normalizeEmail(form?.email);
  const password = String(form?.password || "");

  if (!email || !validateEmail(email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!password || password.length < 6) {
    errors.password = "Informe sua senha corretamente.";
  }

  return errors;
}