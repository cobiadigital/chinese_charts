#!/usr/bin/env python3
"""
Build per-metro GROSS in/out migration flows from the Census ACS
metro-to-metro migration file (2016-2020 5-year estimates).

The PEP datasets used elsewhere on the page only have NET migration; this
file captures the large two-way churn (people moving in AND out) and is the
most recent metro-to-metro flow product Census publishes.

Domestic flows only: counts moves to/from other US metros and US non-metro
("Outside Metro Area within U.S.") areas; excludes foreign origins.

Requires: openpyxl  (pip install openpyxl)

Writes ../data/usa/metro_gross_flows.json

Usage:
    python3 scripts/fetch_usa_flows.py
"""

import json
import sys
import tempfile
from pathlib import Path
from urllib.request import Request, urlopen

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl is required: pip install openpyxl")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "usa"
OUT.mkdir(parents=True, exist_ok=True)

URL = ("https://www2.census.gov/programs-surveys/demo/tables/geographic-mobility/"
       "2020/metro-to-metro-migration/metro-to-metro-ins-outs-nets-gross-2016-2020.xlsx")

TOP_N = 22


RURAL = "99999"  # "Outside Metro Area within U.S. or Puerto Rico" (non-metro node)


def is_domestic(code):
    # All US geographies (metros + the non-metro node) have 5-digit numeric codes;
    # foreign regions end in "--" and footnote rows are free text.
    return code.isdigit() and len(code) == 5


def is_foreign(code):
    return code.endswith("--")


def num(v):
    try:
        return int(v)
    except (ValueError, TypeError):
        return 0


def download(url):
    req = Request(url, headers={"User-Agent": "usa-migration-maps/1.0"})
    with urlopen(req, timeout=120) as r:
        return r.read()


def main():
    print("Downloading metro-to-metro flows (ACS 2016-2020)...")
    raw = download(URL)
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tf:
        tf.write(raw)
        tmp = tf.name

    wb = openpyxl.load_workbook(tmp, read_only=True)
    ws = wb.active

    names = {}
    tin, tout, tintl = {}, {}, {}  # domestic in, domestic out, international in

    for row in ws.iter_rows(min_row=4, values_only=True):
        a, b, na, nb, flow, _, counter = row[0], row[1], row[2], row[3], row[4], row[5], row[6]
        if a is None or b is None:
            continue
        a, b = str(a).strip(), str(b).strip()
        a_dom, b_dom = is_domestic(a), is_domestic(b)
        a_for, b_for = is_foreign(a), is_foreign(b)
        if not (a_dom or b_dom):
            continue  # foreign-foreign or junk footnote rows
        # A node gets a bar only if it is a real metro (domestic, not the rural node).
        a_bar = a_dom and a != RURAL
        b_bar = b_dom and b != RURAL
        flow = num(flow)        # B -> A  (into A)
        counter = num(counter)  # A -> B  (out of A)
        if a_bar:
            names.setdefault(a, str(na))
            if b_dom:            # domestic counterpart: count in/out churn
                tin[a] = tin.get(a, 0) + flow
                tout[a] = tout.get(a, 0) + counter
            elif b_for:          # foreign origin: count arrivals from abroad
                tintl[a] = tintl.get(a, 0) + flow
        if b_bar:
            names.setdefault(b, str(nb))
            if a_dom:
                tin[b] = tin.get(b, 0) + counter
                tout[b] = tout.get(b, 0) + flow
            elif a_for:
                tintl[b] = tintl.get(b, 0) + counter

    metros = []
    for code, name in names.items():
        i, o = tin.get(code, 0), tout.get(code, 0)
        intl = tintl.get(code, 0)
        metros.append({
            "code": code,
            "name": name.replace(" Metro Area", ""),
            "in": i,
            "out": o,
            "intl": intl,
            "net": i - o,
            "gross": i + o,
        })
    metros.sort(key=lambda m: m["gross"], reverse=True)
    top = metros[:TOP_N]

    path = OUT / "metro_gross_flows.json"
    with open(path, "w") as f:
        json.dump({
            "source": "US Census Bureau, ACS 2016-2020 5-year estimates, metro-to-metro migration flows",
            "indicator": "Gross migration per metro: domestic in/out plus international arrivals (people)",
            "period": "2016-2020",
            "note": "in/out are domestic moves (US metros + US non-metro areas); intl is arrivals from abroad. ACS measures residence one year prior, so emigration abroad is not captured. Most recent metro-to-metro flow product published by Census.",
            "metros": top,
        }, f, separators=(",", ":"))
    print(f"  wrote {path.relative_to(ROOT)} ({path.stat().st_size:,} bytes), {len(top)} metros")
    t = top[0]
    print(f"  largest by churn: {t['name']} (in {t['in']:,} / out {t['out']:,} / abroad {t['intl']:,})")


if __name__ == "__main__":
    main()
