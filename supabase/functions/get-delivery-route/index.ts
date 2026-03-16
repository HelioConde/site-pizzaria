import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método não permitido" }),
        { status: 405, headers: corsHeaders }
      );
    }

    const ORS_API_KEY = Deno.env.get("ORS_API_KEY");

    if (!ORS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ORS_API_KEY não configurada" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const body = await req.json();

    const originLat = Number(body?.originLat);
    const originLng = Number(body?.originLng);
    const destLat = Number(body?.destLat);
    const destLng = Number(body?.destLng);

    const invalid =
      [originLat, originLng, destLat, destLng].some((value) =>
        Number.isNaN(value)
      );

    if (invalid) {
      return new Response(
        JSON.stringify({ error: "Coordenadas inválidas" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const orsResponse = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [
            [originLng, originLat],
            [destLng, destLat],
          ],
          instructions: false,
        }),
      }
    );

    const orsData = await orsResponse.json();

    if (!orsResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "Erro ao consultar openrouteservice",
          details: orsData,
        }),
        {
          status: orsResponse.status,
          headers: corsHeaders,
        }
      );
    }

    const feature = orsData?.features?.[0];
    const geometry = feature?.geometry ?? null;
    const summary = feature?.properties?.summary ?? {};

    return new Response(
      JSON.stringify({
        geometry,
        distance: summary?.distance ?? null,
        duration: summary?.duration ?? null,
        raw: orsData,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Erro interno ao calcular rota",
        details: String(error),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});