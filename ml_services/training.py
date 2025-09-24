import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import json

# Load data
df = pd.read_csv('synthetic_agri_forecasting_dataset.csv')

# Prepare features and target
# Use all numeric features + one-hot encoded booleans
numeric_features = df.select_dtypes(include=[np.number]).columns.tolist()
if 'Actual_Yield' in numeric_features:
    numeric_features.remove('Actual_Yield')
boolean_features = df.select_dtypes(include=[bool]).columns.tolist()

X = df[numeric_features + boolean_features]
y = df['Actual_Yield']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train Random Forest
rf = RandomForestRegressor(
    n_estimators=100, max_depth=15,
    min_samples_split=5, min_samples_leaf=2,
    random_state=42, n_jobs=-1
)
rf.fit(X_train, y_train)

# Example sample input from test set (index 0)
i = 0
input_sample = X_test.iloc[i:i+1]
historical_avg = df.loc[X_test.index[i], 'Avg_Yield_Last_3Years']

# Model prediction and ensemble confidence interval
tree_preds = np.array([tree.predict(input_sample)[0] for tree in rf.estimators_])
pred = np.mean(tree_preds)
ci_lower = np.percentile(tree_preds, 5)
ci_upper = np.percentile(tree_preds, 95)

# Model metrics (on test set)
y_pred = rf.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

# vs historical % calculation
vs_historical_pct = 100 * (pred - historical_avg) / historical_avg

# Feature importances (top 4)
importances = rf.feature_importances_
feat_names = X.columns
top_idx = np.argsort(importances)[-4:][::-1]
feature_importances = [
    {"name": feat_names[i], "impact": round(importances[i], 2)}
    for i in top_idx
]

# Custom explanation (simple example, can be improved)
explanation_text = (
    "Prediction is above historical average. "
    "Top drivers: " + ", ".join(f["name"] for f in feature_importances)
)

# Format result as JSON
result = {
    "prediction": {
        "yield_t_ha": round(pred, 2),
        "ci_lower": round(ci_lower, 2),
        "ci_upper": round(ci_upper, 2),
        "rmse": round(rmse, 3),
        "r2": round(r2, 2)
    },
    "vs_historical_pct": round(vs_historical_pct, 1),
    "feature_importances": feature_importances,
    "explanation_text": explanation_text
}
print(json.dumps(result, indent=2))
