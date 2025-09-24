# HarvestIQ

HarvestIQ is an AI-powered, farmer‑friendly decision support system that provides crop yield predictions, real‑time weather risk assessments, and actionable irrigation schedules using ML + rule‑based logic (with optional LLM enhancements). The UI is designed to be simple and practical for field use.

## Key Features

- Yield prediction via Python ML service
- Live weather and risk assessment (7‑day forecast driven)
- Actionable irrigation plan (dates, amounts in mm and L/ha/acre)
- Soil-aware guidance (type, pH, drainage)
- Scenario simulation (normal, drought, wet)
- Save and view prediction history (Supabase)
- PDF export of dashboard

## Monorepo Structure

```
.
├─ Frontend/               # React + Vite + TypeScript app
│  └─ src/
│     ├─ components/       # UI components (Shadcn UI)
│     ├─ pages/            # Pages (Dashboard, Landing, etc.)
│     ├─ contexts/         # Auth, i18n
│     ├─ lib/              # clients, mock data, helpers
│     └─ integrations/     # Supabase client/types
└─ ml_services/            # Python Flask ML API and utilities
   ├─ app.py               # Flask app (health, predict, irrigation)
   ├─ integrated_crop_prediction_training.py
   ├─ training.py          # Example training script
   ├─ requirements.txt     # Python dependencies
   └─ soilgrids_*.py       # Geo/soil utilities (optional)
```

## Architecture Overview

- Frontend (Vite + React + TS)
  - Collects user inputs (location, crop, season, sowing date, soil)
  - Fetches 7‑day forecast (WeatherAPI) for temp/rain/humidity
  - Calls ML API `/predict`, then calls `/irrigation` to compute the schedule
  - Computes risk score live from forecast + soil + stage window
  - Displays a farmer‑friendly irrigation panel, yield, risk, trends
  - Supabase used to persist prediction history

- Backend (Flask)
  - `/health`: health check
  - `/predict`: returns yield + crop cycle details from trained model
  - `/irrigation`: rule‑based schedule from crop, sowing date, weekly forecast, soil profile, and model output

## Prerequisites

- Node.js 18+
- Python 3.10+
- Git

Optional (for full functionality):
- Weather API key (`weatherapi.com`)
- Supabase project (for history persistence)

## Environment Variables

Frontend (`Frontend/.env` or system env via Vite):
```
# ML API base (defaults to http://127.0.0.1:5000 if not set)
VITE_ML_API_URL=http://127.0.0.1:5000

# Weather API (set to enable real forecast/risk UI)
VITE_WEATHER_API_BASE_URL=https://api.weatherapi.com/v1
VITE_WEATHER_API_KEY=YOUR_WEATHER_API_KEY

# Supabase (only if you enable auth/history)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Backend (optional, with sensible defaults):
```
# Model/data override (optional)
AGRI_MODEL_PATH=ml_services/agri_forecasting_model.pkl
AGRI_DATASET_PATH=ml_services/large_agri_dataset.csv
```

## Getting Started

### 1) Backend (Python ML API)

```
cd ml_services
python -m venv .venv
# Windows
. .venv/Scripts/activate
# macOS/Linux
# source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

# Run the Flask API
python app.py
```

- Default URL: `http://127.0.0.1:5000`
- Health check: `GET /health`

#### API Endpoints

- `POST /predict`
  - Body (JSON):
    ```json
    {
      "crop_type": "Rice",
      "avg_temp": 28.5,
      "tmax": 33.2,
      "tmin": 24.1,
      "sowing_date": "2025-07-01"
    }
    ```
  - Returns: prediction, feature_importances, crop_cycle, explanation_text

- `POST /irrigation`
  - Body (JSON):
    ```json
    {
      "crop_type": "Rice",
      "sowing_date": "2025-07-01",
      "weekly_forecast": [
        { "day": "Mon", "temp": 29, "rain": 6, "humidity": 78 },
        { "day": "Tue", "temp": 31, "rain": 2, "humidity": 70 }
      ],
      "crop_cycle": {},
      "soil_profile": { "type": "loam", "ph": 6.5, "organicMatterPct": 1.5, "drainage": "moderate" }
    }
    ```
  - Returns: `irrigation_schedule` (2‑week windows) and `water_savings` (% vs baseline)

### 2) Frontend (Vite + React)

```
cd Frontend
npm install
# or: pnpm i / bun install

# Run dev server
npm run dev
```

- Default URL: `http://127.0.0.1:5173`
- The Dashboard uses real forecast when `VITE_WEATHER_API_*` is set, otherwise it falls back to mock data for that part.

## Using the App

1. Select district, crop, season, and sowing date (left panel)
2. Optionally set soil type, pH, organic matter, drainage
3. Click “Generate Forecast”
4. The main dashboard will render:
   - Real weather and risk (simple sentence reasons)
   - Yield prediction with confidence and key drivers
   - Irrigation schedule (dates, Water/No water, mm + L/ha/L/acre)
   - Water budget bar and simple farmer tips
5. Save the prediction to history (requires Supabase setup)

## PDF Export

- Click “Download schedule” in the irrigation card or the header PDF button to save a one‑page PDF of the dashboard.

## Development Notes

- Frontend: Vite + React + TypeScript + Tailwind + Shadcn UI
- State: local React state; minimal global context for i18n and auth
- Backend: Flask app with a trained `EnhancedCropCyclePredictionModel`
- Irrigation: deterministic rule‑based logic (safe without LLM). If you want to add LLM:
  - Create a backend proxy route (e.g., `/irrigation/llm`) that enriches recommendations with Gemini/Vertex AI
  - Keep rule‑based as fallback for offline reliability

## Troubleshooting

- Frontend shows mock data for weather
  - Ensure `VITE_WEATHER_API_BASE_URL` and `VITE_WEATHER_API_KEY` are set
- Frontend can’t reach ML API
  - Set `VITE_ML_API_URL` to your Flask server origin (e.g., `http://127.0.0.1:5000`)
  - Confirm `python app.py` is running and no firewall blocks
- Python dependency issues on geo stack
  - `fiona`/`geopandas` may require GDAL/GEOS/PROJ system libs. If you don’t use `soilgrids_districts.py`, you can skip installing those (comment them out in `requirements.txt`).
- Supabase errors
  - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` and table schema match the app’s expected columns.

## Security & Keys

- Do not commit API keys. Use environment variables or a local `.env` not tracked by Git.

## License

This project is provided as-is for hackathon/demonstration purposes. Add your desired license here.

## Acknowledgements

- Weather data via `weatherapi.com`
- UI components via Shadcn UI

