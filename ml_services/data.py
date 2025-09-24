import pandas as pd
import numpy as np

# -----------------------------
# Configuration
# -----------------------------
years = list(range(2000, 2026))
districts = ["Durg", "Raipur", "Bilaspur", "Korba", "Rajnandgaon", "Bemetara"]
states = {dist: "Chhattisgarh" for dist in districts}
dist_codes = {dist: i+1 for i, dist in enumerate(districts)}
state_codes = {state: i+1 for i, state in enumerate(set(states.values()))}

# Crops list
crops = [
    "RICE", "WHEAT", "KHARIF.SORGHUM", "RABI.SORGHUM", "SORGHUM",
    "PEARL.MILLET", "MAIZE", "FINGER.MILLET", "BARLEY", "CHICKPEA",
    "PIGEONPEA", "MINOR.PULSES", "GROUNDNUT", "SESAMUM", "RAPESEED.AND.MUSTARD",
    "SAFFLOWER", "CASTOR", "LINSEED", "SUNFLOWER", "SOYABEAN", "OILSEEDS",
    "SUGARCANE", "COTTON", "FRUITS", "VEGETABLES", "FRUITS.AND.VEGETABLES",
    "POTATOES", "ONION", "FODDER"
]

# Base area (1000 ha) and yield (Kg/ha)
crop_base = {crop: {"area": np.random.uniform(50, 200), "yield": np.random.uniform(1000, 4000)}
             for crop in crops}

# -----------------------------
# Generate Weather per District per Year
# -----------------------------
np.random.seed(42)
weather_data = {}
for dist in districts:
    weather_data[dist] = {}
    for year in years:
        # Rainfall and temperature
        rainfall = np.random.normal(1200, 200)  # mm
        temp = np.random.normal(26, 3)  # °C
        gdd = np.random.normal(1500, 200)
        weather_data[dist][year] = {"rainfall": rainfall, "temp": temp, "gdd": gdd}

# -----------------------------
# Generate Synthetic Dataset
# -----------------------------
data_rows = []

for year in years:
    for dist in districts:
        row = {
            "Dist.Code": dist_codes[dist],
            "Year": year,
            "State.Code": state_codes[states[dist]],
            "State.Name": states[dist],
            "Dist.Name": dist
        }

        weather = weather_data[dist][year]
        total_area_allocated = 0

        for crop in crops:
            # Crop area: negatively correlated if total area increases
            base_area = crop_base[crop]["area"]
            area_variation = np.random.normal(0, 0.15 * base_area)
            # Reduce area slightly if total_area_allocated is high
            area = max(10, base_area + area_variation - total_area_allocated*0.05)
            total_area_allocated += area

            # Yield affected by crop type and weather
            yield_base = crop_base[crop]["yield"]

            # Kharif crops depend on rainfall
            if crop in ["RICE", "KHARIF.SORGHUM", "MAIZE", "PEARL.MILLET", "SORGHUM", "GROUNDNUT"]:
                yield_factor = 0.7 + 0.3 * (weather["rainfall"]/1200) + 0.2 * (weather["temp"]/26)
            # Rabi crops depend on temperature/GDD
            elif crop in ["WHEAT", "RABI.SORGHUM", "BARLEY", "CHICKPEA"]:
                yield_factor = 0.7 + 0.3 * (weather["gdd"]/1500) + 0.2 * (weather["temp"]/26)
            else:
                yield_factor = np.random.uniform(0.85, 1.15)

            yield_kg_ha = yield_base * yield_factor * np.random.uniform(0.9, 1.1)

            # Production in 1000 tons: area (1000 ha) * yield (Kg/ha) / 1000
            production = area * yield_kg_ha / 1000

            row[f"{crop}.AREA..1000.ha."] = round(area, 2)
            row[f"{crop}.PRODUCTION..1000.tons."] = round(production, 2)
            row[f"{crop}.YIELD..Kg.per.ha."] = round(yield_kg_ha, 2)

        data_rows.append(row)

# -----------------------------
# Save CSV
# -----------------------------
df = pd.DataFrame(data_rows)
df.to_csv("synthetic_yield_data_realistic.csv", index=False)
print("Synthetic dataset generated: synthetic_yield_data_realistic.csv")
