from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from integrated_crop_prediction_training import EnhancedCropCyclePredictionModel
from datetime import datetime, timedelta
from typing import List, Dict, Any
import math

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.environ.get('AGRI_MODEL_PATH', 'agri_forecasting_model.pkl')
DATASET_PATH = os.environ.get('AGRI_DATASET_PATH', 'D:/Hackathons/Vortexa/HarvestIQ/ml_services/large_agri_dataset.csv')

# Load the trained model at server start (with fallback to train if missing)
model = EnhancedCropCyclePredictionModel.load_model(MODEL_PATH)
if model is None and os.path.exists(DATASET_PATH):
    try:
        import pandas as pd
        df = pd.read_csv(DATASET_PATH)
        model = EnhancedCropCyclePredictionModel()
        model.train_models(df)
        model.save_model(MODEL_PATH)
    except Exception as e:
        print(f"Failed to train model on startup: {e}")
        model = None

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if model is None:
            return jsonify({"error": "Model not loaded"}), 503

        data = request.get_json(force=True)
        # print("/predict request:", data)
        crop = data['crop_type']
        avg_temp = float(data['avg_temp'])
        tmax = float(data['tmax'])
        tmin = float(data['tmin'])
        sowing_date = data.get('sowing_date')  # Optional

        prediction = model.predict_with_current_date(crop, avg_temp, tmax, tmin, sowing_date)
        # print("/predict response:", prediction)
        return jsonify(prediction)
    except KeyError as ke:
        return jsonify({"error": f"Missing field: {str(ke)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Optional: endpoint to retrain and refresh the model
@app.route("/train", methods=["POST"])
def train():
    try:
        payload = request.get_json(silent=True) or {}
        print("/train request:", payload)
        dataset_path = payload.get('dataset_path', DATASET_PATH)
        import pandas as pd
        df = pd.read_csv(dataset_path)
        new_model = EnhancedCropCyclePredictionModel()
        new_model.train_models(df)
        new_model.save_model(MODEL_PATH)
        global model
        model = new_model
        # print("/train response: trained with metrics:", new_model.metrics)
        return jsonify({"status": "trained", "metrics": new_model.metrics})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


def _rule_based_irrigation_schedule(
    crop: str,
    sowing_date: str,
    weekly_forecast: List[Dict[str, Any]],
    crop_cycle: Dict[str, Any] | None,
    soil: Dict[str, Any] | None,
) -> Dict[str, Any]:
    """Generate a pragmatic irrigation schedule using simple heuristics.

    Returns a dict containing irrigation_schedule (list) and water_savings (int percentage).
    """
    # Parse sowing date
    try:
        start_date = datetime.strptime(sowing_date, "%Y-%m-%d")
    except Exception:
        start_date = datetime.utcnow()

    # Compute expected ET adjustment based on forecast temperatures
    avg_temp = None
    if weekly_forecast:
        temps = [float(d.get("temp", 0)) for d in weekly_forecast if isinstance(d.get("temp"), (int, float, str))]
        temps = [float(t) for t in temps if not math.isnan(float(t))]
        if temps:
            avg_temp = sum(temps) / len(temps)

    # Basic crop-stage mapping if crop_cycle provided
    stages = []
    if crop_cycle and isinstance(crop_cycle, dict):
        growth_stages = crop_cycle.get("crop_cycle", {}).get("growth_stages") or crop_cycle.get("growth_stages")
        if isinstance(growth_stages, dict):
            # growth_stages may be dict keyed by stage index
            for k in sorted(growth_stages.keys(), key=lambda x: int(x) if str(x).isdigit() else 0):
                stages.append(growth_stages[k])
        elif isinstance(growth_stages, list):
            stages = growth_stages

    # Soil adjustments
    soil_type = (soil or {}).get("type", "").lower()
    drainage = (soil or {}).get("drainage", "").lower()
    soil_factor = 1.0
    if "clay" in soil_type:
        soil_factor -= 0.1  # holds water longer
    if "sandy" in soil_type:
        soil_factor += 0.15 # drains fast
    if drainage == "poor":
        soil_factor -= 0.1
    elif drainage == "good":
        soil_factor += 0.05

    # Heuristic schedule across 8 weeks from sowing
    schedule: List[Dict[str, Any]] = []
    for i in range(4):
        # each entry covers 2 weeks
        window_start = start_date + timedelta(days=i*14)
        window_end = window_start + timedelta(days=13)
        # Estimate rain within this window from provided weekly forecast if available
        rain_est_mm = 0.0
        if weekly_forecast:
            # weekly_forecast is list of dicts with rain per day; we only have 7 days → scale
            rains = [float(d.get("rain", 0) or 0) for d in weekly_forecast if isinstance(d.get("rain"), (int, float, str))]
            if rains:
                avg_week_rain = sum(rains) / len(rains)
                # assume pattern repeats → 2-week rain approximately 2x weekly avg
                rain_est_mm = 2.0 * avg_week_rain

        # Base irrigation mm for two-week window depending on crop
        crop_lc = (crop or "").lower()
        if "rice" in crop_lc:
            base_mm = 120
        elif "wheat" in crop_lc:
            base_mm = 80
        elif "maize" in crop_lc or "corn" in crop_lc:
            base_mm = 100
        elif "sugarcane" in crop_lc:
            base_mm = 180
        else:
            base_mm = 90

        # Temperature adjustment
        if avg_temp is not None:
            if avg_temp >= 34:
                base_mm *= 1.2
            elif avg_temp <= 22:
                base_mm *= 0.9

        # Soil factor
        base_mm *= soil_factor

        # Rain offset: subtract 60% of expected rain from requirement
        req_mm = max(0, base_mm - 0.6 * rain_est_mm)

        # Map to action
        if req_mm < 25:
            action = "Skip"
            amount = None
            reason = "Natural rainfall sufficient"
        else:
            action = "Irrigate"
            # Split into two applications ~half each
            amount = str(int(round(req_mm / 2.0)))
            # Stage-aware reason
            reason = "Supplemental irrigation"
            if i == 1:
                reason = "Tillering/vegetative support"
            if i == 2:
                reason = "Flowering critical period"

        schedule.append({
            "week": f"Week {i*2+1}-{i*2+2}",
            "action": action,
            **({"amount": amount} if amount is not None else {}),
            "reason": reason,
        })

    # Estimate water savings vs fixed schedule of 120 mm per 2 weeks
    fixed_total = 4 * 120
    actual_total = sum(int(s.get("amount", 0)) for s in schedule if s.get("action") == "Irrigate")
    savings = int(round((fixed_total - actual_total) / fixed_total * 100)) if fixed_total else 0
    savings = max(-100, min(100, savings))

    return {"irrigation_schedule": schedule, "water_savings": savings}


@app.route("/irrigation", methods=["POST"])
def irrigation():
    try:
        data = request.get_json(force=True) or {}
        crop = data.get("crop_type") or data.get("crop")
        sowing_date = data.get("sowing_date") or datetime.utcnow().strftime("%Y-%m-%d")
        weekly_forecast = data.get("weekly_forecast") or []
        crop_cycle = data.get("crop_cycle") or {}
        soil = data.get("soil_profile") or {}

        # For robustness in hackathon setting, use rule-based by default.
        result = _rule_based_irrigation_schedule(crop, sowing_date, weekly_forecast, crop_cycle, soil)

        return jsonify({
            "crop_type": crop,
            "sowing_date": sowing_date,
            "irrigation_schedule": result["irrigation_schedule"],
            "water_savings": result["water_savings"],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)