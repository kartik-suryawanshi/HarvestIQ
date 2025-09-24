# soilgrids_jalgaon.py
import requests
import time
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point
from shapely.geometry import Polygon
import random

# ====== CONFIG ======
DIST_SHAPEFILE = "gadm41_IND_shp.zip"  # GADM zip
OUT_CSV = "soilgrids_jalgaon.csv"
SOIL_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
PROPERTIES_TO_EXTRACT = ['soc','phh2o','clay','sand','silt','bdod']
MAX_RETRIES = 5
TIMEOUT = 120
BACKOFF = 5
SAMPLE_POINTS = 5  # number of random points to try inside polygon
# ====================

def safe_req(url, params, retries=MAX_RETRIES, backoff=BACKOFF, timeout=TIMEOUT):
    for i in range(retries):
        try:
            r = requests.get(url, params=params, timeout=timeout)
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            print("Request error:", e)
        time.sleep(backoff * (i+1))
    return None

def extract_weighted_0_30(prop_json):
    if not prop_json:
        return None

    depths = prop_json.get('depths') or prop_json.get('layers') or prop_json.get('values')
    if not depths:
        for k in ('value','mean','m'):
            if k in prop_json:
                return prop_json.get(k)
        return None

    vals, weights = [], []
    for d in depths:
        val = None
        if isinstance(d, dict):
            for key in ('value','mean','m','median'):
                if key in d and isinstance(d[key], (int,float)):
                    val = d[key]; break
            if val is None and 'values' in d and isinstance(d['values'], dict):
                for key in ('mean','mean_value','m'):
                    if key in d['values'] and isinstance(d['values'][key], (int,float)):
                        val = d['values'][key]; break
            thickness = None
            if 'depth_range' in d and isinstance(d['depth_range'], dict):
                upper = d['depth_range'].get('upper')
                lower = d['depth_range'].get('lower')
                if upper is not None and lower is not None:
                    thickness = abs(upper - lower)
            if thickness is None and 'depth' in d and isinstance(d['depth'], str):
                s = d['depth'].replace('cm','').strip()
                parts = s.split('-')
                if len(parts) == 2:
                    try:
                        thickness = abs(float(parts[1]) - float(parts[0]))
                    except:
                        thickness = None
            if val is not None:
                vals.append(val)
                weights.append(thickness if (thickness and thickness>0) else 1.0)
    if not vals:
        return None
    return sum(v*w for v,w in zip(vals,weights)) / sum(weights)

def get_points_within_polygon(polygon, num_points=SAMPLE_POINTS):
    """Generate random points inside a polygon"""
    minx, miny, maxx, maxy = polygon.bounds
    points = []
    while len(points) < num_points:
        pnt = Point(random.uniform(minx, maxx), random.uniform(miny, maxy))
        if polygon.contains(pnt):
            points.append(pnt)
    return points

# ====== LOAD DISTRICT ======
gdf = gpd.read_file(DIST_SHAPEFILE, layer="gadm41_IND_2")
gdf = gdf.to_crs(epsg=4326)

# Filter Jalgaon district
jalgaon_gdf = gdf[(gdf['NAME_2'] == 'Jalgaon') & (gdf['NAME_1'] == 'Maharashtra')]
if jalgaon_gdf.empty:
    raise ValueError("Jalgaon district not found!")

row = jalgaon_gdf.iloc[0]

# Try multiple points inside polygon to find valid soil data
points = get_points_within_polygon(row['geometry'])
points.insert(0, row['geometry'].centroid)  # add centroid as first point

soil_data = None
for pt in points:
    lon, lat = pt.x, pt.y
    params = {'lon': lon, 'lat': lat}
    resp_json = safe_req(SOIL_URL, params)
    if resp_json and 'properties' in resp_json:
        soil_data = resp_json
        break  # stop at first successful point
    time.sleep(0.5)

entry = {
    'district_name': 'Jalgaon',
    'lon': lon,
    'lat': lat
}

if soil_data and 'properties' in soil_data:
    for prop in PROPERTIES_TO_EXTRACT:
        val = None
        if prop in soil_data['properties']:
            val = extract_weighted_0_30(soil_data['properties'][prop])
        else:
            for k in soil_data['properties'].keys():
                if prop.lower() in k.lower():
                    val = extract_weighted_0_30(soil_data['properties'][k])
                    break
        entry[prop + '_0_30'] = val
else:
    for prop in PROPERTIES_TO_EXTRACT:
        entry[prop + '_0_30'] = None

# Save CSV
df = pd.DataFrame([entry])
df.to_csv(OUT_CSV, index=False)
print("Saved:", OUT_CSV)
print(df)
