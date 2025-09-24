// Supabase Edge Function: crop-suggest
// Receives soil parameters, calls Gemini, returns crop suggestion and reasoning

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type SoilPayload = {
  soilType?: string;
  ph?: number | string;
  organicMatterPct?: number | string;
  drainage?: '' | 'poor' | 'moderate' | 'good' | string;
  location?: string;
  crop?: string;
};

function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  } as Record<string, string>;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }

  const headers = corsHeaders(req);

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing GEMINI_API_KEY' }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const body: SoilPayload = await req.json().catch(() => ({}));
    const ph = typeof body.ph === 'string' ? parseFloat(body.ph) : body.ph;
    const organicMatterPct = typeof body.organicMatterPct === 'string' ? parseFloat(body.organicMatterPct) : body.organicMatterPct;

    const prompt = `You are an agronomy assistant. Given the soil profile below, decide which crop will most likely produce the HIGHEST YIELD for the next season, and rank the top 3.

Soil Profile:
- Type: ${body.soilType ?? 'unknown'}
- pH: ${Number.isFinite(ph) ? ph : 'unknown'}
- Organic Matter (%): ${Number.isFinite(organicMatterPct) ? organicMatterPct : 'unknown'}
- Drainage: ${body.drainage ?? 'unknown'}
- Location/Region: ${body.location ?? 'unspecified'}
- Intended Crop (optional): ${body.crop ?? 'none'}

Instructions:
- Think about yield drivers (pH range fit, drainage tolerance, OM%, typical response).
- If region provided, reflect common local choices; otherwise be region-agnostic.
- Return STRICT JSON only with keys:
  { "topCrop": string, "crops": string[], "rationale": string }
- Put the highest-yield choice in topCrop and first in crops.
`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, topP: 0.9, topK: 32, maxOutputTokens: 512 },
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: 'Gemini API error', details: text }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const data: any = await res.json();
    // Gemini response shape: candidates[0].content.parts[0].text
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    // Try to parse JSON from the model; if it fails, wrap as rationale
    let payload: any;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { crops: [], rationale: text ?? 'No rationale.' };
    }

    // Normalize to UI shape
    if (payload && payload.topCrop && Array.isArray(payload.crops)) {
      if (!payload.crops.includes(payload.topCrop)) payload.crops.unshift(payload.topCrop);
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected error', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});


