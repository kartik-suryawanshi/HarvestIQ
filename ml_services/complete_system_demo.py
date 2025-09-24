
# DEMONSTRATION: Complete Agri-Forecasting Hub with Crop Cycle Prediction
# This shows the enhanced system that predicts both yield and crop cycles

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

# Sample enhanced prediction output
enhanced_prediction_example = {
    "prediction": {
        "yield_t_ha": 4.35,
        "ci_lower": 3.82,
        "ci_upper": 4.91,
        "crop_type": "Rice"
    },
    "crop_cycle": {
        "sowing_date": "2023-06-15",
        "season_length_days": 134,
        "days_to_maturity": 134,
        "predicted_maturity_date": "2023-10-26",
        "harvest_window": {
            "start": "2023-10-31",
            "end": "2023-11-10"
        },
        "growth_stages": {
            "stage_0": {
                "name": "Germination",
                "bbch_code": 0,
                "days_from_sowing": 7,
                "predicted_date": "2023-06-22"
            },
            "stage_1": {
                "name": "Leaf Development",
                "bbch_code": 1,
                "days_from_sowing": 27,
                "predicted_date": "2023-07-12"
            },
            "stage_2": {
                "name": "Tillering",
                "bbch_code": 2,
                "days_from_sowing": 47,
                "predicted_date": "2023-08-01"
            },
            "stage_3": {
                "name": "Stem Elongation",
                "bbch_code": 3,
                "days_from_sowing": 67,
                "predicted_date": "2023-08-21"
            },
            "stage_5": {
                "name": "Heading",
                "bbch_code": 5,
                "days_from_sowing": 87,
                "predicted_date": "2023-09-10"
            },
            "stage_6": {
                "name": "Flowering",
                "bbch_code": 6,
                "days_from_sowing": 94,
                "predicted_date": "2023-09-17"
            },
            "stage_7": {
                "name": "Grain Filling",
                "bbch_code": 7,
                "days_from_sowing": 114,
                "predicted_date": "2023-10-07"
            },
            "stage_8": {
                "name": "Maturity",
                "bbch_code": 8,
                "days_from_sowing": 134,
                "predicted_date": "2023-10-26"
            }
        }
    },
    "vs_historical_pct": 8.5,
    "feature_importances": [
        {"name": "NDVI", "impact": 0.234},
        {"name": "Rainfall", "impact": 0.189},
        {"name": "Growing_Degree_Days", "impact": 0.156},
        {"name": "Soil_pH", "impact": 0.112}
    ],
    "explanation_text": "Prediction for Rice: 4.4 tons/ha. Key driver: NDVI. Favorable growing conditions with adequate rainfall and optimal vegetation health indicators."
}

print("🌾 COMPLETE AGRI-FORECASTING HUB DEMONSTRATION")
print("="*65)
print(json.dumps(enhanced_prediction_example, indent=2))
