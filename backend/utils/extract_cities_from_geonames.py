import json
import os

INPUT_FILE = os.path.join(os.path.dirname(__file__), '../IN/IN.txt')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../data/cities_india.json')

# GeoNames columns (tab-separated):
# 0: geonameid, 1: name, 2: asciiname, 3: alternatenames, 4: latitude, 5: longitude, 6: feature class, 7: feature code, ...
# 14: population, 15: elevation, ...

city_features = {'PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLC', 'PPLF', 'PPLG', 'PPLL', 'PPLR', 'PPLS', 'PPLX', 'STLMT'}

cities = []

with open(INPUT_FILE, encoding='utf-8') as f:
    for line in f:
        parts = line.strip().split('\t')
        if len(parts) < 16:
            continue
        feature_class = parts[6]
        feature_code = parts[7]
        if feature_class == 'P' and feature_code in city_features:
            try:
                city = {
                    'geonameid': parts[0],
                    'name': parts[1],
                    'asciiname': parts[2],
                    'lat': float(parts[4]),
                    'lng': float(parts[5]),
                    'population': int(parts[14]) if parts[14].isdigit() else 0,
                    'elevation': int(parts[15]) if parts[15].lstrip('-').isdigit() else None,
                    'admin1_code': parts[10],
                    'admin2_code': parts[11],
                    'timezone': parts[17] if len(parts) > 17 else '',
                }
                cities.append(city)
            except Exception as e:
                continue

# Save as compact JSON
with open(OUTPUT_FILE, 'w', encoding='utf-8') as out:
    json.dump(cities, out, ensure_ascii=False, separators=(',', ':'))

print(f"Extracted {len(cities)} cities to {OUTPUT_FILE}") 