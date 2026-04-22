"""
build_city_bivariate.py
=======================
Generates bivariate MSOA-level GeoJSON for Birmingham and Leeds,
matching the structure of public/data/part2/bivariate_boroughs.geojson
used by the AdequacyMap component.

Outputs
-------
  public/data/part2/birmingham_msoa_bivariate.geojson
  public/data/part2/leeds_msoa_bivariate.geojson

Data sources
------------
  Boundaries : ONS Open Geography Portal (ArcGIS FeatureServer)
               MSOA_2021_EW_BFE_V8_RUC, layer 3
  Census      : NOMIS NM_2063_1 – TS045 Car or van availability 2021
               (percentage of households with no car or van)
  Stations    : public/data/part1/{city}_charging_osm.geojson (local)

Requirements
------------
  geopandas >= 0.10   (Anaconda: D:/Anaconda/python.exe)
  pandas, numpy, shapely  (bundled with geopandas)
  stdlib: json, urllib, ssl, pathlib, collections

Run from the repo root:
  D:/Anaconda/python.exe scripts/build_city_bivariate.py
"""

import json
import ssl
import sys
import time
import urllib.request
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote

import geopandas as gpd
import numpy as np
import pandas as pd
from shapely.geometry import shape

# ── Paths ─────────────────────────────────────────────────────────────────────
REPO_ROOT   = Path(__file__).resolve().parent.parent
DATA_PART1  = REPO_ROOT / "public" / "data" / "part1"
DATA_PART2  = REPO_ROOT / "public" / "data" / "part2"

# ── SSL context (suppress cert errors on some Windows Python builds) ──────────
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode    = ssl.CERT_NONE

# ── ONS / NOMIS endpoints ─────────────────────────────────────────────────────
BOUNDARY_SVC = (
    "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services"
    "/MSOA_2021_EW_BFE_V8_RUC/FeatureServer/3/query"
)
NOMIS_TS045  = "https://www.nomisweb.co.uk/api/v01/dataset/NM_2063_1.data.json"

# ── City definitions ──────────────────────────────────────────────────────────
CITIES = {
    "birmingham": {
        "msoa_prefix": "Birmingham",
        "osm_file":    DATA_PART1 / "birmingham_charging_osm.geojson",
        "out_file":    DATA_PART2 / "birmingham_msoa_bivariate.geojson",
    },
    "leeds": {
        "msoa_prefix": "Leeds",
        "osm_file":    DATA_PART1 / "leeds_charging_osm.geojson",
        "out_file":    DATA_PART2 / "leeds_msoa_bivariate.geojson",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# Helper utilities
# ─────────────────────────────────────────────────────────────────────────────

def fetch_json(url, retries=3, delay=2):
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(url, context=CTX, timeout=30) as r:
                return json.loads(r.read())
        except Exception as exc:
            if attempt < retries - 1:
                print(f"  [retry {attempt+1}] {exc}")
                time.sleep(delay)
            else:
                raise


def fetch_boundary_geojson(msoa_prefix):
    """Return a GeoJSON FeatureCollection of all MSOAs whose name starts with
    *msoa_prefix* (e.g. 'Birmingham', 'Leeds')."""
    where  = f"MSOA21NM LIKE '{msoa_prefix}%'"
    params = (
        f"?where={quote(where)}"
        "&outFields=MSOA21CD,MSOA21NM"
        "&f=geojson"
        "&outSR=4326"
        "&resultRecordCount=300"
    )
    data = fetch_json(BOUNDARY_SVC + params)
    features = data.get("features", [])
    if not features:
        raise RuntimeError(f"No boundary features returned for prefix '{msoa_prefix}'")
    print(f"  Boundaries : {len(features)} MSOAs")
    return data


def fetch_no_car_pct(msoa_codes):
    """Return dict {msoa_code -> pct_no_car (0–100)} from NOMIS TS045."""
    # NOMIS accepts comma-separated geography codes; safe=, avoids encoding them
    codes_str = ",".join(msoa_codes)
    params = (
        f"?geography={quote(codes_str, safe=',')}"
        "&c2021_cars_5=1"         # category: no cars or vans
        "&measures=20301"          # measure: percent
        "&select=geography_code,geography_name,obs_value"
    )
    data = fetch_json(NOMIS_TS045 + params)
    obs  = data.get("obs", [])
    if not obs:
        raise RuntimeError(f"NOMIS returned no data. Error: {data.get('error', 'unknown')}")
    print(f"  NOMIS data : {len(obs)} MSOA records")
    return {
        o["geography"]["geogcode"]: float(o["obs_value"]["value"])
        for o in obs
    }


def load_osm_stations(geojson_path):
    """Load local OSM GeoJSON (may have BOM), return GeoDataFrame of Points."""
    with open(geojson_path, encoding="utf-8-sig") as f:
        gj = json.load(f)
    gdf = gpd.GeoDataFrame.from_features(gj["features"], crs="EPSG:4326")
    # Keep only Point geometries
    gdf = gdf[gdf.geometry.geom_type == "Point"].copy()
    print(f"  OSM points : {len(gdf)} charging stations")
    return gdf


def count_stations_per_msoa(stations_gdf, msoa_gdf):
    """
    Spatial join: count stations within each MSOA polygon.
    Uses a manual loop with shapely (no rtree/pygeos required).
    Two passes:
      1. poly.covers(pt)  — strict containment + boundary points
      2. nearest-MSOA fallback for points just outside the boundary (< 400 m)
    """
    stations_gdf = stations_gdf.to_crs(msoa_gdf.crs)
    msoa_polys   = list(zip(msoa_gdf["MSOA21CD"].tolist(), msoa_gdf.geometry.tolist()))

    counts       = defaultdict(int)
    unmatched    = []
    total        = len(stations_gdf)

    # Pass 1: strict covers
    for i, pt in enumerate(stations_gdf.geometry):
        if i % 50 == 0:
            print(f"    pass1 {i}/{total}...", end="\r", flush=True)
        if pt is None or pt.is_empty:
            continue
        hit = False
        for code, poly in msoa_polys:
            if poly is not None and poly.covers(pt):
                counts[code] += 1
                hit = True
                break
        if not hit:
            unmatched.append(pt)

    print(f"    pass1 {total}/{total} done — {len(unmatched)} unmatched")

    # Pass 2: assign unmatched to nearest MSOA if within ~400 m
    # In WGS84 at UK latitudes, 0.004 degrees ≈ 280 m (lon) / 445 m (lat)
    THRESHOLD = 0.004
    near_matched = 0
    for pt in unmatched:
        best_code = None
        best_dist = THRESHOLD
        for code, poly in msoa_polys:
            if poly is None:
                continue
            d = poly.exterior.distance(pt)
            if d < best_dist:
                best_dist  = d
                best_code  = code
        if best_code:
            counts[best_code] += 1
            near_matched += 1

    far_missed = len(unmatched) - near_matched
    print(f"    pass2 done — {near_matched} snapped to nearest; {far_missed} beyond boundary")
    return pd.Series(dict(counts), name="total_chargers")


def compute_area_km2(gdf):
    """Return Series of MSOA areas in km², projected to BNG (EPSG:27700)."""
    gdf_proj = gdf.to_crs("EPSG:27700")
    return gdf_proj.geometry.area / 1e6   # m² → km²


def assign_tercile(series):
    """
    Assign 1/2/3 tier based on equal-count tertiles.
    Handles ties and zero-heavy distributions robustly.
    """
    s = series.fillna(0).astype(float)
    # Use rank (average method breaks ties) then cut into thirds
    ranked = s.rank(method="average")
    n = len(ranked)
    bins = [0, n / 3, 2 * n / 3, n + 1]
    tier = pd.cut(ranked, bins=bins, labels=[1, 2, 3], include_lowest=True)
    return tier.astype(int)


# ─────────────────────────────────────────────────────────────────────────────
# Main pipeline
# ─────────────────────────────────────────────────────────────────────────────

def process_city(city_key, config):
    print(f"\n{'='*56}")
    print(f"  Processing : {city_key.title()}")
    print(f"{'='*56}")

    # 1. MSOA boundaries
    bounds_gj  = fetch_boundary_geojson(config["msoa_prefix"])
    bounds_gdf = gpd.GeoDataFrame.from_features(bounds_gj["features"], crs="EPSG:4326")
    bounds_gdf = bounds_gdf.rename(columns={"MSOA21CD": "MSOA21CD", "MSOA21NM": "MSOA21NM"})

    # Simplify geometry for smaller output files (~10× reduction)
    # 0.0005° ≈ 35 m at UK latitudes — visually lossless at map scale
    bounds_gdf.geometry = bounds_gdf.geometry.simplify(
        tolerance=0.0005, preserve_topology=True
    )
    print(f"  Simplified : geometries to 0.0005° tolerance")

    # 2. Census: no-car household %
    codes          = bounds_gdf["MSOA21CD"].tolist()
    no_car_map     = fetch_no_car_pct(codes)
    bounds_gdf["pct_no_car_raw"] = bounds_gdf["MSOA21CD"].map(no_car_map)

    missing = bounds_gdf["pct_no_car_raw"].isna().sum()
    if missing:
        print(f"  Warning    : {missing} MSOAs missing census data; filling with city median")
        median = bounds_gdf["pct_no_car_raw"].median()
        bounds_gdf["pct_no_car_raw"] = bounds_gdf["pct_no_car_raw"].fillna(median)

    # Convert to 0–1 proportion to match London format
    bounds_gdf["pct_no_car"] = bounds_gdf["pct_no_car_raw"] / 100.0

    # 3. MSOA area in km²
    bounds_gdf["area_km2"] = compute_area_km2(bounds_gdf).values

    # 4. Load OSM stations & spatial join
    stations_gdf                = load_osm_stations(config["osm_file"])
    counts                      = count_stations_per_msoa(stations_gdf, bounds_gdf)
    bounds_gdf                  = bounds_gdf.join(counts, on="MSOA21CD", how="left")
    bounds_gdf["total_chargers"] = bounds_gdf["total_chargers"].fillna(0).astype(int)

    unmatched = (stations_gdf.shape[0] - counts.sum())
    print(f"  Matched    : {int(counts.sum())} stations assigned; "
          f"{int(unmatched)} outside any MSOA boundary")

    # 5. Supply metric: chargers per km² (density), then tercile
    #    Small epsilon prevents division by zero for tiny MSOAs
    bounds_gdf["chargers_per_km2"] = (
        bounds_gdf["total_chargers"] / bounds_gdf["area_km2"].clip(lower=0.01)
    )

    # 6. Bivariate tiers
    bounds_gdf["demand_tier"] = assign_tercile(bounds_gdf["pct_no_car"])
    bounds_gdf["supply_tier"] = assign_tercile(bounds_gdf["chargers_per_km2"])
    bounds_gdf["bivariate_class"] = (
        bounds_gdf["demand_tier"].astype(str)
        + "-"
        + bounds_gdf["supply_tier"].astype(str)
    )

    # Diagnostic summary
    print(f"  Bivariate  : {bounds_gdf['bivariate_class'].value_counts().to_dict()}")
    print(f"  Demand     : mean no-car = {bounds_gdf['pct_no_car'].mean():.1%}")
    print(f"  Supply     : {bounds_gdf['total_chargers'].sum()} total chargers, "
          f"{(bounds_gdf['total_chargers'] == 0).sum()} MSOAs with 0")

    # 7. Build output GeoJSON
    features = []
    for _, row in bounds_gdf.iterrows():
        geom = row["geometry"]
        if geom is None or geom.is_empty:
            continue
        features.append({
            "type": "Feature",
            "geometry": json.loads(gpd.GeoSeries([geom], crs="EPSG:4326").to_json())
                            ["features"][0]["geometry"],
            "properties": {
                "name":            row["MSOA21NM"],
                "gss_code":        row["MSOA21CD"],
                "pct_no_car":      round(float(row["pct_no_car"]),   4),
                "total_chargers":  int(row["total_chargers"]),
                "area_km2":        round(float(row["area_km2"]),     2),
                "chargers_per_km2":round(float(row["chargers_per_km2"]), 3),
                "demand_tier":     int(row["demand_tier"]),
                "supply_tier":     int(row["supply_tier"]),
                "bivariate_class": row["bivariate_class"],
            },
        })

    out_gj = {"type": "FeatureCollection", "features": features}

    # 8. Write output
    out_path = config["out_file"]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out_gj, f, ensure_ascii=False, separators=(",", ":"))

    print(f"  Saved      : {out_path.relative_to(REPO_ROOT)}")
    print(f"              ({len(features)} features, "
          f"{out_path.stat().st_size // 1024} KB)")

    return out_gj


if __name__ == "__main__":
    DATA_PART2.mkdir(parents=True, exist_ok=True)

    results = {}
    for key, cfg in CITIES.items():
        try:
            results[key] = process_city(key, cfg)
        except Exception as exc:
            print(f"\n  ERROR processing {key}: {exc}", file=sys.stderr)
            raise

    print("\n\nAll cities processed successfully.")
    for key, gj in results.items():
        print(f"  {key:12s} : {len(gj['features'])} MSOA features")
