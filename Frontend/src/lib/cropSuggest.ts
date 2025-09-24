export interface CropSuggestionRequest {
  soilType: string;
  ph: string; // keep string to match inputs; parse in service if needed
  organicMatterPct?: string;
  drainage: 'poor' | 'moderate' | 'good' | string;
  location?: string;
  crop?: string;
}

export interface CropSuggestionResponse {
  crops: string[];
  rationale?: string;
}

// Temporary client-side mock until backend endpoint is provided.
export async function getCropSuggestion(req: CropSuggestionRequest): Promise<CropSuggestionResponse> {
  const suggestionsBySoil: Record<string, string[]> = {
    clay: ['Rice', 'Sugarcane', 'Wheat'],
    loam: ['Wheat', 'Maize', 'Soybean'],
    sandy: ['Groundnut', 'Millet', 'Cotton'],
  };

  const key = (req.soilType || '').toLowerCase();
  const crops = suggestionsBySoil[key] || ['Wheat', 'Rice', 'Maize'];
  const rationale = `Based on soil=${req.soilType}, pH=${req.ph}, drainage=${req.drainage}${req.location ? `, location=${req.location}` : ''}.`;
  // Simulate latency
  await new Promise((r) => setTimeout(r, 500));
  return { crops, rationale };
}


