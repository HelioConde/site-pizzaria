function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isTooGenericResult(result) {
  const formatted = normalizeText(result?.formatted || "");

  const genericPlaces = [
    "brasil",
    "brasilia brasil",
    "brasilia distrito federal brasil",
    "distrito federal brasil",
  ];

  return genericPlaces.includes(formatted);
}

function hasMinimumAddressSimilarity(searchText, resultText) {
  const search = normalizeText(searchText);
  const result = normalizeText(resultText);

  const importantTokens = search
    .split(" ")
    .filter((token) => token.length >= 2)
    .filter(
      (token) =>
        ![
          "brasil",
          "df",
          "brasilia",
          "samambaia",
          "norte",
          "sul",
          "casa",
          "quadra",
          "conjunto",
        ].includes(token)
    );

  if (importantTokens.length === 0) return false;

  const matched = importantTokens.filter((token) => result.includes(token));

  return matched.length / importantTokens.length >= 0.5;
}

function buildOpenCageUrl(addressText, apiKey) {
  const url = new URL("https://api.opencagedata.com/geocode/v1/json");
  url.searchParams.set("q", addressText);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("countrycode", "br");
  url.searchParams.set("limit", "5");
  url.searchParams.set("no_annotations", "1");
  url.searchParams.set("pretty", "0");
  return url.toString();
}

async function requestOpenCage(addressText, apiKey) {
  if (!String(addressText || "").trim()) {
    return null;
  }

  if (!apiKey) {
    throw new Error("API key do OpenCage não configurada.");
  }

  const url = buildOpenCageUrl(addressText, apiKey);
  console.log("URL OpenCage:", url);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível localizar o endereço no mapa.");
  }

  const data = await response.json();
  console.log("RESPOSTA OPENCAGE:", data);

  if (!Array.isArray(data?.results) || data.results.length === 0) {
    return null;
  }

  const betterMatch = data.results[0];
  const lat = betterMatch?.geometry?.lat;
  const lng = betterMatch?.geometry?.lng;
  const confidence = Number(betterMatch?.confidence || 0);
  const formatted = betterMatch?.formatted || "";

  console.log("MELHOR MATCH OPENCAGE:", {
    searched: addressText,
    formatted,
    confidence,
    lat,
    lng,
  });

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  if (confidence < 4) {
    return null;
  }

  if (isTooGenericResult(betterMatch)) {
    return null;
  }

  if (!hasMinimumAddressSimilarity(addressText, formatted)) {
    return null;
  }

  return {
    lat: Number(lat),
    lng: Number(lng),
    displayName: formatted,
    confidence,
    raw: betterMatch,
  };
}

export function buildGeocodeAddress(deliveryForm) {
  const parts = [
    deliveryForm?.address,
    deliveryForm?.number,
    deliveryForm?.district,
    deliveryForm?.city,
    deliveryForm?.state,
    "Brasil",
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return parts.join(", ");
}

export function buildGeocodeAddressWithCep(deliveryForm) {
  const parts = [
    deliveryForm?.address,
    deliveryForm?.number,
    deliveryForm?.district,
    deliveryForm?.city,
    deliveryForm?.state,
    deliveryForm?.cep,
    "Brasil",
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return parts.join(", ");
}

export async function geocodeAddress(addressText, apiKey) {
  return requestOpenCage(addressText, apiKey);
}

export async function geocodeAddressStructured(
  { address, number, district, city, state, cep },
  apiKey
) {
  const parts = [
    address,
    number,
    district,
    city,
    state,
    cep,
    "Brasil",
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return requestOpenCage(parts.join(", "), apiKey);
}

export async function geocodePostalCode(cep, apiKey) {
  const cepDigits = String(cep || "").replace(/\D/g, "");

  if (cepDigits.length !== 8) {
    return null;
  }

  return requestOpenCage(`${cepDigits}, Brasil`, apiKey);
}