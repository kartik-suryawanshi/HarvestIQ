from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from integrated_crop_prediction_training import EnhancedCropCyclePredictionModel

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.environ.get('AGRI_MODEL_PATH', 'agri_forecasting_model.pkl')
DATASET_PATH = os.environ.get('AGRI_DATASET_PATH', 'large_agri_dataset.csv')

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
        print("/predict request:", data)
        crop = data['crop_type']
        avg_temp = float(data['avg_temp'])
        tmax = float(data['tmax'])
        tmin = float(data['tmin'])
        sowing_date = data.get('sowing_date')  # Optional

        prediction = model.predict_with_current_date(crop, avg_temp, tmax, tmin, sowing_date)
        print("/predict response:", prediction)
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
        print("/train response: trained with metrics:", new_model.metrics)
        return jsonify({"status": "trained", "metrics": new_model.metrics})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
