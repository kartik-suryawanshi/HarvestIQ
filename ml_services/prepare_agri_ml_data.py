import pandas as pd
import numpy as np

# ----------------------------
# CONFIG
# ----------------------------
YIELD_FILE = "dld_yield_complete.csv"
WEATHER_FILE = "Processed_AgriWeather.csv"
OUTPUT_FILE = "AgriML_training_data.csv"

# ----------------------------
# LOAD DATA
# ----------------------------
print("📥 Loading datasets...")
yield_df = pd.read_csv(YIELD_FILE)
weather_df = pd.read_csv(WEATHER_FILE)

# ----------------------------
# PROCESS WEATHER DATA
# ----------------------------
print("⛅ Processing weather data...")
weather_df["DATE"] = pd.to_datetime(weather_df["DATE"])
weather_df["Year"] = weather_df["DATE"].dt.year

# Aggregate daily → yearly
weather_yearly = weather_df.groupby("Year").agg({
    "Rainfall_mm": "sum",
    "Temp_Max_C": "mean",
    "Temp_Min_C": "mean",
    "Temp_Mean_C": "mean",
    "SolarRad_MJ_m2": "mean",
    "Rel_Humidity_pct": "mean",
    "WindSpeed_mps": "mean",
    "GDD": "sum"
}).reset_index()

# ----------------------------
# PROCESS YIELD DATA
# ----------------------------
print("🌾 Processing yield data...")
# Keep only yield columns
yield_cols = [c for c in yield_df.columns if "YIELD" in c]
id_cols = ["Year", "Dist.Name"]

# Convert wide → long
yield_long = yield_df[id_cols + yield_cols].melt(
    id_vars=id_cols,
    var_name="Crop",
    value_name="Yield_Kg_ha"
)

# Clean crop names
yield_long["Crop"] = yield_long["Crop"].str.replace(".YIELD..Kg.per.ha.", "", regex=False)
yield_long["Crop"] = yield_long["Crop"].str.replace(".", " ", regex=False).str.strip()

# ----------------------------
# MERGE WEATHER + YIELD
# ----------------------------
print("🔗 Merging weather with yield data...")
merged = yield_long.merge(weather_yearly, on="Year", how="left")

# ----------------------------
# ADD SYNTHETIC FEATURES
# ----------------------------
print("🌱 Adding synthetic NDVI & Soil properties...")
np.random.seed(42)
merged["NDVI"] = np.round(np.random.uniform(0.2, 0.8, size=len(merged)), 3)
merged["Soil_OrganicCarbon"] = np.round(np.random.uniform(0.5, 2.5, size=len(merged)), 2)
merged["Soil_pH"] = np.round(np.random.uniform(5.5, 7.5, size=len(merged)), 2)
merged["Soil_ClayPct"] = np.round(np.random.uniform(15, 45, size=len(merged)), 1)
merged["Soil_SandPct"] = np.round(np.random.uniform(30, 70, size=len(merged)), 1)

# ----------------------------
# REORDER COLUMNS
# ----------------------------
final_df = merged[[
    "Year", "Dist.Name", "Crop", "Yield_Kg_ha",
    "Rainfall_mm", "Temp_Mean_C", "SolarRad_MJ_m2",
    "Rel_Humidity_pct", "WindSpeed_mps", "GDD",
    "NDVI", "Soil_OrganicCarbon", "Soil_pH",
    "Soil_ClayPct", "Soil_SandPct"
]]

# ----------------------------
# SAVE CSV
# ----------------------------
print(f"💾 Saving final dataset to {OUTPUT_FILE}...")
final_df.to_csv(OUTPUT_FILE, index=False)

print("✅ Done! Sample preview:")
print(final_df.head(10))
