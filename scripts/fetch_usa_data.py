#!/usr/bin/env python3
"""
Build JSON datasets for the US metro/rural migration maps.

Pulls (no API key required):
  - Census PEP county components of change   (co-est2023-alldata.csv)
  - Census PEP metro (CBSA) components        (cbsa-est2023-alldata.csv)
  - USDA ERS Rural-Urban Continuum Codes 2023 (county classification)
  - Plotly US counties GeoJSON (FIPS)         (bundled for the choropleth)

Writes into ../data/usa/:
  state_migration.json     net domestic migration by state, 2021-2023
  county_migration.json    net domestic migration RATE by county, 2021-2023
  metro_rural_trend.json   net domestic migration summed by RUCC bucket/year
  top_metros.json          top metro gainers & losers (2023)
  counties-fips.geojson    county boundaries for the choropleth

Usage:
    python3 scripts/fetch_usa_data.py
"""

import csv
import io
import json
import sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "usa"
OUT.mkdir(parents=True, exist_ok=True)

CO_EST = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/counties/totals/co-est2025-alldata.csv"
CBSA_EST = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/metro/totals/cbsa-est2025-alldata.csv"
RUCC = "https://ers.usda.gov/sites/default/files/_laserfiche/DataFiles/53251/Ruralurbancontinuumcodes2023.csv"
GEOJSON = "https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json"

YEARS = ["2021", "2022", "2023", "2024", "2025"]

FIPS_TO_USPS = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
    "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
    "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
    "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
    "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
    "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
    "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
    "54": "WV", "55": "WI", "56": "WY",
}

# RUCC 2023 code -> display bucket. Odd nonmetro codes (5,7,9) are NOT adjacent
# to a metro area; even (4,6,8) are adjacent.
RUCC_BUCKET = {
    "1": "Large metro (1M+)",
    "2": "Metro 250K-1M",
    "3": "Small metro (<250K)",
    "4": "Nonmetro, near metro",
    "6": "Nonmetro, near metro",
    "8": "Nonmetro, near metro",
    "5": "Rural, remote",
    "7": "Rural, remote",
    "9": "Rural, remote",
}
BUCKET_ORDER = [
    "Large metro (1M+)", "Metro 250K-1M", "Small metro (<250K)",
    "Nonmetro, near metro", "Rural, remote",
]


def fetch_text(url, timeout=90):
    req = Request(url, headers={"User-Agent": "usa-migration-maps/1.0"})
    with urlopen(req, timeout=timeout) as r:
        raw = r.read()
    for enc in ("utf-8-sig", "latin-1"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def write_json(name, data):
    path = OUT / name
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    print(f"  wrote {path.relative_to(ROOT)} ({path.stat().st_size:,} bytes)")


def to_int(v):
    try:
        return int(float(v))
    except (ValueError, TypeError):
        return None


def to_float(v):
    try:
        return float(v)
    except (ValueError, TypeError):
        return None


def build_from_county_file():
    """Returns (state_rows, county_rows) parsed from co-est2023."""
    text = fetch_text(CO_EST)
    reader = csv.DictReader(io.StringIO(text))
    states, counties = [], []
    for row in reader:
        sumlev = row["SUMLEV"]
        if sumlev == "040":
            states.append(row)
        elif sumlev == "050":
            counties.append(row)
    return states, counties


def build_state(states):
    out = []
    for r in states:
        fips = r["STATE"]
        usps = FIPS_TO_USPS.get(fips)
        if not usps:
            continue
        out.append({
            "fips": fips,
            "usps": usps,
            "name": r["STNAME"],
            "pop": to_int(r[f"POPESTIMATE{YEARS[-1]}"]),
            "domesticmig": {y: to_int(r[f"DOMESTICMIG{y}"]) for y in YEARS},
        })
    write_json("state_migration.json", {
        "source": "US Census Bureau, Population Estimates Program, Vintage 2025 (co-est2025-alldata)",
        "indicator": "Net domestic migration (people), July 1 year-over-year",
        "years": YEARS,
        "states": out,
    })


def build_county(counties):
    out = []
    for r in counties:
        fips = r["STATE"] + r["COUNTY"]
        out.append({
            "fips": fips,
            "name": f'{r["CTYNAME"]}, {FIPS_TO_USPS.get(r["STATE"], r["STATE"])}',
            "rate": {y: to_float(r.get(f"RDOMESTICMIG{y}")) for y in YEARS},
        })
    write_json("county_migration.json", {
        "source": "US Census Bureau, Population Estimates Program, Vintage 2025 (co-est2025-alldata)",
        "indicator": "Net domestic migration rate (per 1,000 residents)",
        "years": YEARS,
        "counties": out,
    })


def build_metro_rural_trend(counties):
    text = fetch_text(RUCC)
    rucc = {}
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        if row.get("Attribute") == "RUCC_2023":
            rucc[row["FIPS"].zfill(5)] = row["Value"].strip()

    totals = {b: {y: 0 for y in YEARS} for b in BUCKET_ORDER}
    matched, unmatched = 0, 0
    for r in counties:
        fips = r["STATE"] + r["COUNTY"]
        code = rucc.get(fips)
        bucket = RUCC_BUCKET.get(code)
        if not bucket:
            unmatched += 1
            continue
        matched += 1
        for y in YEARS:
            v = to_int(r.get(f"DOMESTICMIG{y}"))
            if v is not None:
                totals[bucket][y] += v
    print(f"    RUCC matched {matched} counties, unmatched {unmatched}")
    write_json("metro_rural_trend.json", {
        "source": "US Census Bureau PEP Vintage 2025 + USDA ERS Rural-Urban Continuum Codes 2023",
        "indicator": "Net domestic migration (people) summed by county type",
        "buckets": BUCKET_ORDER,
        "years": YEARS,
        "totals": totals,
    })


def build_top_metros():
    text = fetch_text(CBSA_EST)
    reader = csv.DictReader(io.StringIO(text))
    latest = YEARS[-1]
    metros = []
    for row in reader:
        if row.get("LSAD") != "Metropolitan Statistical Area":
            continue
        dm = to_int(row.get(f"DOMESTICMIG{latest}"))
        if dm is None:
            continue
        metros.append({
            "name": row["NAME"],
            "domesticmig": dm,
            "pop": to_int(row.get(f"POPESTIMATE{latest}")),
        })
    metros.sort(key=lambda m: m["domesticmig"], reverse=True)
    gainers = metros[:12]
    losers = list(reversed(metros[-12:]))
    write_json("top_metros.json", {
        "source": "US Census Bureau, Population Estimates Program, Vintage 2025 (cbsa-est2025-alldata)",
        "indicator": f"Net domestic migration (people), {latest}, Metropolitan Statistical Areas",
        "year": latest,
        "gainers": gainers,
        "losers": losers,
    })


def fetch_geojson():
    text = fetch_text(GEOJSON)
    # validate it parses then write verbatim
    json.loads(text)
    path = OUT / "counties-fips.geojson"
    with open(path, "w") as f:
        f.write(text)
    print(f"  wrote {path.relative_to(ROOT)} ({path.stat().st_size:,} bytes)")


def main():
    print(f"Writing into {OUT}")
    failures = []
    try:
        print("County components of change (Census co-est2025)...")
        states, counties = build_from_county_file()
        build_state(states)
        build_county(counties)
        build_metro_rural_trend(counties)
    except Exception as exc:
        print(f"  FAILED county pipeline: {exc}", file=sys.stderr)
        failures.append("county pipeline")
    try:
        print("Metro (CBSA) components (Census cbsa-est2025)...")
        build_top_metros()
    except Exception as exc:
        print(f"  FAILED top_metros: {exc}", file=sys.stderr)
        failures.append("top_metros")
    try:
        print("County GeoJSON (Plotly datasets)...")
        fetch_geojson()
    except Exception as exc:
        print(f"  FAILED geojson: {exc}", file=sys.stderr)
        failures.append("geojson")
    print()
    if failures:
        print(f"{len(failures)} step(s) failed: {', '.join(failures)}")
        sys.exit(1)
    print("Done.")


if __name__ == "__main__":
    main()
