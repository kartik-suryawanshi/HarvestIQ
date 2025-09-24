export interface MlPredictRequest {
  crop_type: string;
  avg_temp: number;
  tmax: number;
  tmin: number;
  sowing_date: string; // YYYY-MM-DD
}

export interface MlPredictResponse {
  crop_cycle: any;
  explanation_text: string;
  feature_importances: Array<{ name: string; impact: number }>;
  prediction: { yield_t_ha: number; crop_type: string; ci_lower?: number; ci_upper?: number };
}

export async function predictCrop(body: MlPredictRequest, baseUrl?: string): Promise<MlPredictResponse> {
  const apiBase = baseUrl || (import.meta as any).env?.VITE_ML_API_URL || 'http://127.0.0.1:5000';
  const res = await fetch(`${apiBase}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ML API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export interface IrrigationRequest {
  crop_type: string;
  sowing_date: string; // YYYY-MM-DD
  weekly_forecast: Array<{ day?: string; temp?: number; rain?: number }>;
  crop_cycle?: any;
  soil_profile?: { type?: string; ph?: number; organicMatterPct?: number; drainage?: 'poor' | 'moderate' | 'good' };
}

export interface IrrigationResponse {
  crop_type: string;
  sowing_date: string;
  irrigation_schedule: Array<{ week: string; action: string; amount?: string; reason: string }>;
  water_savings: number;
}

export async function getIrrigationSchedule(body: IrrigationRequest, baseUrl?: string): Promise<IrrigationResponse> {
  const apiBase = baseUrl || (import.meta as any).env?.VITE_ML_API_URL || 'http://127.0.0.1:5000';
  const res = await fetch(`${apiBase}/irrigation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ML API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}


