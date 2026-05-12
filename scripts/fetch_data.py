#!/usr/bin/env python3
"""
Pull World Bank + Our World in Data datasets and write tidy JSON files
to ../data/. Run this whenever you want to refresh the snapshot.

Usage:
    python3 scripts/fetch_data.py

Requires: requests (`pip install requests`). Falls back to urllib if absent.
"""

import json
import os
import sys
from pathlib import Path

try:
    import requests  # noqa: F401
    USE_REQUESTS = True
except ImportError:
    USE_REQUESTS = False

import urllib.request
import urllib.error
import csv
import io

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)


def fetch(url, timeout=60):
    if USE_REQUESTS:
        import requests
        r = requests.get(url, timeout=timeout, headers={"User-Agent": "china-charts/1.0"})
        r.raise_for_status()
        return r.text
    req = urllib.request.Request(url, headers={"User-Agent": "china-charts/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8")


def write_json(name, data):
    path = DATA_DIR / name
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  wrote {path.relative_to(ROOT)} ({len(json.dumps(data))} bytes)")


def wb_series(country, indicator):
    """Return list of {year, value} pairs from World Bank API, sorted by year."""
    url = (
        f"https://api.worldbank.org/v2/country/{country}"
        f"/indicator/{indicator}?format=json&per_page=20000"
    )
    raw = fetch(url)
    payload = json.loads(raw)
    if not isinstance(payload, list) or len(payload) < 2 or not payload[1]:
        raise RuntimeError(f"unexpected WB payload for {country}/{indicator}: {payload[:200]}")
    rows = [
        {"year": int(r["date"]), "value": r["value"]}
        for r in payload[1]
        if r.get("value") is not None
    ]
    rows.sort(key=lambda x: x["year"])
    return rows


# -- 2. Fertility rate (WB SP.DYN.TFRT.IN) ----------------------------------
def fetch_fertility():
    print("Fertility rate (World Bank SP.DYN.TFRT.IN)...")
    series = wb_series("CHN", "SP.DYN.TFRT.IN")
    write_json("fertility_rate.json", {
        "source": "World Bank Open Data (SP.DYN.TFRT.IN)",
        "country": "CHN",
        "indicator": "Total fertility rate (births per woman)",
        "series": series
    })


# -- 4. Urban share (WB SP.URB.TOTL.IN.ZS) ----------------------------------
def fetch_urban():
    print("Urban share (World Bank SP.URB.TOTL.IN.ZS)...")
    series = wb_series("CHN", "SP.URB.TOTL.IN.ZS")
    write_json("urban_rural.json", {
        "source": "World Bank Open Data (SP.URB.TOTL.IN.ZS)",
        "country": "CHN",
        "indicator": "Urban population (% of total)",
        "series": series
    })


# -- 5. GDP growth (WB NY.GDP.MKTP.KD.ZG) -----------------------------------
def fetch_gdp_growth():
    print("GDP growth (World Bank NY.GDP.MKTP.KD.ZG)...")
    series = wb_series("CHN", "NY.GDP.MKTP.KD.ZG")
    write_json("gdp_growth.json", {
        "source": "World Bank Open Data (NY.GDP.MKTP.KD.ZG)",
        "country": "CHN",
        "indicator": "Real GDP growth (annual %)",
        "series": series
    })


# -- 6. Sector value added shares (WB NV.{AGR,IND,SRV}.TOTL.ZS) -------------
def fetch_sector_shares():
    print("Sector shares (World Bank NV.*.TOTL.ZS)...")
    agr = wb_series("CHN", "NV.AGR.TOTL.ZS")
    ind = wb_series("CHN", "NV.IND.TOTL.ZS")
    srv = wb_series("CHN", "NV.SRV.TOTL.ZS")
    write_json("sector_shares.json", {
        "source": "World Bank Open Data (NV.AGR.TOTL.ZS, NV.IND.TOTL.ZS, NV.SRV.TOTL.ZS)",
        "country": "CHN",
        "indicator": "Sector value added (% of GDP)",
        "agriculture": agr,
        "industry": ind,
        "services": srv
    })


# -- 7. China share of global manufacturing value added (current USD) -------
def fetch_mfg_share():
    print("Manufacturing share (World Bank NV.IND.MANF.CD)...")
    chn = wb_series("CHN", "NV.IND.MANF.CD")
    wld = wb_series("WLD", "NV.IND.MANF.CD")
    wld_map = {r["year"]: r["value"] for r in wld}
    series = []
    for r in chn:
        w = wld_map.get(r["year"])
        if w and w > 0:
            series.append({"year": r["year"], "value": 100.0 * r["value"] / w})
    write_json("mfg_share_global.json", {
        "source": "World Bank Open Data (NV.IND.MANF.CD, CHN ÷ WLD × 100)",
        "country": "CHN",
        "indicator": "China share of global manufacturing value added (%)",
        "series": series
    })


# -- 9. CO2 emissions, China vs World vs USA (OWID) -------------------------
def fetch_co2():
    print("CO2 emissions (Our World in Data)...")
    url = "https://nyc3.digitaloceanspaces.com/owid-public/data/co2/owid-co2-data.csv"
    # Fallback to GitHub raw if DO host doesn't work
    try:
        raw = fetch(url)
    except Exception:
        raw = fetch("https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv")
    reader = csv.DictReader(io.StringIO(raw))
    keep = {"China": "china", "World": "world", "United States": "usa"}
    out = {v: [] for v in keep.values()}
    for row in reader:
        country = row.get("country")
        if country not in keep:
            continue
        if not row.get("co2"):
            continue
        try:
            year = int(row["year"])
            val = float(row["co2"])  # CO2 in million tonnes
        except (ValueError, TypeError):
            continue
        if year < 1900:
            continue
        out[keep[country]].append({"year": year, "value": val})
    for k in out:
        out[k].sort(key=lambda x: x["year"])
    write_json("co2_emissions.json", {
        "source": "Our World in Data (owid-co2-data.csv)",
        "indicator": "Annual CO2 emissions (million tonnes)",
        "china": out["china"],
        "world": out["world"],
        "usa": out["usa"]
    })


# -- 8. Electricity generation by source (OWID, China) ----------------------
def fetch_electricity():
    print("Electricity mix (Our World in Data)...")
    url = "https://ourworldindata.org/grapher/electricity-prod-source-stacked.csv?country=CHN"
    raw = fetch(url)
    reader = csv.DictReader(io.StringIO(raw))
    series = {}
    columns = None
    rows = list(reader)
    if not rows:
        raise RuntimeError("empty OWID electricity payload")
    # Identify source columns (everything except Entity/Code/Year)
    sample = rows[0]
    columns = [k for k in sample.keys() if k not in ("Entity", "Code", "Year")]
    for col in columns:
        series[col] = []
    for row in rows:
        if row.get("Code") != "CHN":
            continue
        try:
            year = int(row["Year"])
        except (ValueError, TypeError):
            continue
        for col in columns:
            v = row.get(col)
            if v in (None, ""):
                continue
            try:
                series[col].append({"year": year, "value": float(v)})
            except ValueError:
                pass
    write_json("electricity_mix.json", {
        "source": "Our World in Data (electricity-prod-source-stacked, China)",
        "indicator": "Electricity generation by source (TWh)",
        "sources": series
    })


def main():
    print(f"Writing into {DATA_DIR}")
    steps = [
        fetch_fertility,
        fetch_urban,
        fetch_gdp_growth,
        fetch_sector_shares,
        fetch_mfg_share,
        fetch_co2,
        fetch_electricity,
    ]
    failures = []
    for step in steps:
        try:
            step()
        except Exception as exc:
            print(f"  FAILED: {step.__name__}: {exc}", file=sys.stderr)
            failures.append(step.__name__)
    print()
    if failures:
        print(f"{len(failures)} step(s) failed: {', '.join(failures)}")
        sys.exit(1)
    print("All automated sources fetched. UN WPP and HSR data are compiled manually; see data/README.md.")


if __name__ == "__main__":
    main()
