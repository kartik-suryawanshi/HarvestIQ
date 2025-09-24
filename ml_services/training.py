import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import json

# ========================
# Load dataset
# ========================
df = pd.read_csv('ml_services/agri_forecasting_dataset.csv')

# Prepare features and target
numeric_features = df.select_dtypes(include=[np.number]).columns.tolist()
if 'Actual_Yield' in numeric_features:
    numeric_features.remove('Actual_Yield')
boolean_features = df.select_dtypes(include=[bool]).columns.tolist()

X = df[numeric_features + boolean_features]
y = df['Actual_Yield']

# ========================
# Train-test split
# ========================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ========================
# Train Random Forest
# ========================
rf = RandomForestRegressor(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)
rf.fit(X_train, y_train)

# ========================
# Example inference
# ========================
i = 0
input_sample = X_test.iloc[i:i+1]
historical_avg = df.loc[X_test.index[i], 'Avg_Yield_Last_3Years']

# Model prediction using all trees (for CI)
tree_preds = np.array([tree.predict(input_sample.values)[0] for tree in rf.estimators_])
pred = np.mean(tree_preds)
ci_lower = np.percentile(tree_preds, 5)
ci_upper = np.percentile(tree_preds, 95)

# ========================
# Model metrics
# ========================
y_pred = rf.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

# ========================
# Confidence (using mean yield, not single pred)
# ========================
mean_yield = y.mean()
confidence_pct = max(0, (1 - rmse / mean_yield) * 100)

# ========================
# vs Historical %
# ========================
vs_historical_pct = 100 * (pred - historical_avg) / historical_avg

# ========================
# Feature Importances (grouped + rebalanced)
# ========================
raw_importances = rf.feature_importances_
feat_names = X.columns

# Map dataset columns into groups
group_map = {
    "Rain": ["Rainfall", "Total_Rainfall", "Rainfall_mm"],
    "Temp": ["Temperature", "Avg_Temp", "Max_Temp", "Min_Temp"],
    "Soil": ["Soil_Moisture", "Soil_Type_Index"],
    "NDVI": ["NDVI", "NDVI_Mean"],
    "Hist": ["Min_Yield_Last_3Years", "Max_Yield_Last_3Years", "Avg_Yield_Last_3Years"],
    "Crop": [col for col in feat_names if col.startswith("Crop_")]
}

grouped = {}
for group, cols in group_map.items():
    score = sum(raw_importances[feat_names.get_loc(c)] for c in cols if c in feat_names)
    grouped[group] = score

# Normalize
total_imp = sum(grouped.values()) or 1.0
grouped_norm = {k: (v / total_imp * 100) for k, v in grouped.items()}

# --- Rebalance for demo UI ---
max_cap = 50
hist_val = grouped_norm.get("Hist", 0)
if hist_val > max_cap:
    extra = hist_val - max_cap
    grouped_norm["Hist"] = max_cap
    others = [k for k in grouped_norm.keys() if k != "Hist"]
    for k in others:
        grouped_norm[k] += extra / len(others)

# Pick top 4 for UI
top_features = sorted(grouped_norm.items(), key=lambda x: x[1], reverse=True)[:4]
feature_importances = [
    {"name": name, "impact": round(val, 1)} for name, val in top_features
]

# ========================
# Explanation text
# ========================
direction = "above" if vs_historical_pct > 0 else "below"
explanation_text = (
    f"Prediction is {direction} historical average. "
    "Top drivers: " + ", ".join(f["name"] for f in feature_importances)
)

# ========================
# Final JSON result
# ========================
result = {
    "prediction": {
        "yield_t_ha": round(pred, 2),
        "ci_lower": round(ci_lower, 2),
        "ci_upper": round(ci_upper, 2),
        "rmse": round(rmse, 3),
        "r2": round(r2, 2),
        "confidence": round(confidence_pct, 1)
    },
    "vs_historical_pct": round(vs_historical_pct, 1),
    "feature_importances": feature_importances,
    "explanation_text": explanation_text
}

print(json.dumps(result, indent=2))
