import { supabase } from '@/integrations/supabase/client';

export type CropSuggestResponse = {
  crops?: string[];
  rationale?: string;
  notes?: string;
};

export async function getCropSuggestion(input: {
  soilType?: string;
  ph?: number | string;
  organicMatterPct?: number | string;
  drainage?: '' | 'poor' | 'moderate' | 'good' | string;
  location?: string;
  crop?: string;
}): Promise<CropSuggestResponse> {
  // Dev-only shortcut: if a browser key is present, call Gemini directly (NOT for production)
  const browserKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  if (browserKey) {
    const prompt = `You are an agronomy assistant. Given the soil profile below, decide which crop will most likely produce the HIGHEST YIELD for the next season, and rank the top 3.

Soil Profile:
- Type: ${input.soilType ?? 'unknown'}
- pH: ${typeof input.ph === 'string' ? input.ph : (Number.isFinite(input.ph as number) ? input.ph : 'unknown')}
- Organic Matter (%): ${typeof input.organicMatterPct === 'string' ? input.organicMatterPct : (Number.isFinite(input.organicMatterPct as number) ? input.organicMatterPct : 'unknown')}
- Drainage: ${input.drainage ?? 'unknown'}
- Location/Region: ${input.location ?? 'unspecified'}
- Intended Crop (optional): ${input.crop ?? 'none'}

Instructions:
- Think about yield drivers (pH range fit, drainage tolerance, OM%, typical response).
- If region provided, reflect common local choices; otherwise be region-agnostic.
- Return STRICT JSON only with keys:
  { "topCrop": string, "crops": string[], "rationale": string }
- Put the highest-yield choice in topCrop and first in crops.
`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${browserKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, topP: 0.9, topK: 32, maxOutputTokens: 512 },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini API error: ${text}`);
    }
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    try {
      const parsed = text ? JSON.parse(text) : {};
      // Normalize to { crops, rationale } for UI
      if (parsed && parsed.topCrop && Array.isArray(parsed.crops)) {
        if (!parsed.crops.includes(parsed.topCrop)) parsed.crops.unshift(parsed.topCrop);
      }
      return parsed;
    } catch {
      return { crops: [], rationale: text };
    }
  }

  // Default: call secure Edge Function
  const { data, error } = await supabase.functions.invoke('crop-suggest', { body: input });
  if (error) throw new Error(error.message || 'Crop suggest function failed');
  return (data as CropSuggestResponse) ?? {};
}


