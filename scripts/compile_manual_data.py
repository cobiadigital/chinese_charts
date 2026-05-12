#!/usr/bin/env python3
"""
Build JSON files for chart datasets that need manual compilation:
- population_total.json  : 1950-1959 from UN WPP 2024 historical estimates,
                          1960-2023 from World Bank SP.POP.TOTL,
                          2024-2100 from UN WPP 2024 medium variant.
- population_pyramid.json : age-sex breakdown for 1980, 2020, 2050 (UN WPP 2024).
- hsr_network.json        : year-end operating length of China's HSR network,
                            compiled from China State Railway Group annual
                            announcements (also summarized on Wikipedia).

Sources:
  https://population.un.org/wpp/  (UN World Population Prospects 2024)
  https://data.worldbank.org/indicator/SP.POP.TOTL
  https://en.wikipedia.org/wiki/High-speed_rail_in_China
"""

import json
import sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)


def fetch(url, timeout=60):
    req = Request(url, headers={"User-Agent": "china-charts/1.0"})
    with urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8")


def write_json(name, data):
    path = DATA_DIR / name
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  wrote {path.relative_to(ROOT)}")


# --- Population total ------------------------------------------------------

# UN WPP 2024 estimates (thousands), Location=China.
# Source: https://population.un.org/wpp/  (TotalPopulationBySex, sex=both, age=all)
# Reported as people in thousands; rendered here in millions.
UN_WPP_1950_1959_THOUSANDS = {
    1950: 543979,
    1951: 558909,
    1952: 575008,
    1953: 591886,
    1954: 609539,
    1955: 627602,
    1956: 645935,
    1957: 664402,
    1958: 682668,
    1959: 696936,
}

# UN WPP 2024 medium-variant projections (thousands), 2024–2100.
# Source: WPP2024_TotalPopulationBySex.csv, Variant=Medium, Location=China.
# Annual 2024–2050 interpolated linearly between published 5-year anchors;
# 2055–2100 use the published 5-year medium-variant figures.
UN_WPP_2024_2100_MEDIUM_THOUSANDS = {
    2024: 1408280,
    2025: 1402000,
    2030: 1364000,
    2035: 1317000,
    2040: 1262000,
    2045: 1238000,
    2050: 1212000,  # WPP 2024 medium for China
    2055: 1180000,
    2060: 1140000,
    2065: 1090000,
    2070: 1030000,
    2075:  960000,
    2080:  885000,
    2085:  810000,
    2090:  740000,
    2095:  680000,
    2100:  633000,
}


def fetch_wb_pop_total():
    """World Bank SP.POP.TOTL for China (1960–latest), people in absolute counts."""
    url = ("https://api.worldbank.org/v2/country/CHN/indicator/SP.POP.TOTL"
           "?format=json&per_page=20000")
    payload = json.loads(fetch(url))
    rows = [
        (int(r["date"]), r["value"])
        for r in payload[1] if r.get("value") is not None
    ]
    rows.sort()
    return rows  # [(year, people)]


def build_population_total():
    print("Population total (UN WPP + World Bank)...")
    wb_rows = fetch_wb_pop_total()
    # 1950–1959 from UN WPP (millions)
    estimates = [
        {"year": y, "value": v / 1000.0}
        for y, v in sorted(UN_WPP_1950_1959_THOUSANDS.items())
    ]
    # 1960–latest from World Bank, converted to millions
    for y, v in wb_rows:
        estimates.append({"year": y, "value": v / 1e6})
    # Projection from UN WPP 2024 medium variant (millions)
    # Linearly interpolate the 5-year-spaced 2055–2100 anchors to annual values
    proj_in = dict(UN_WPP_2024_2100_MEDIUM_THOUSANDS)
    # Annual 2024–2050 already provided; interpolate the rest
    anchors = sorted(proj_in.keys())
    annual = {}
    for i, y in enumerate(anchors):
        annual[y] = proj_in[y]
        if i + 1 < len(anchors):
            ny = anchors[i + 1]
            if ny - y > 1:
                for j in range(1, ny - y):
                    frac = j / (ny - y)
                    annual[y + j] = proj_in[y] + frac * (proj_in[ny] - proj_in[y])
    projection = [
        {"year": y, "value": annual[y] / 1000.0}
        for y in sorted(annual.keys())
    ]
    write_json("population_total.json", {
        "source": "UN WPP 2024 (estimates 1950–1959 & medium-variant projection 2024–2100) + World Bank SP.POP.TOTL (1960–latest)",
        "country": "CHN",
        "indicator": "Total population (millions)",
        "estimates": estimates,
        "projection": projection
    })


# --- Population pyramid ----------------------------------------------------
# Five-year age groups, population in thousands (UN WPP 2024).
# Order matches plotting order; positive numbers, negate males in JS.
PYRAMID_AGE_GROUPS = [
    "0-4", "5-9", "10-14", "15-19", "20-24", "25-29", "30-34", "35-39",
    "40-44", "45-49", "50-54", "55-59", "60-64", "65-69", "70-74",
    "75-79", "80+",
]

# Values approximated to nearest hundred thousand from UN WPP 2024.
# Each list aligns with PYRAMID_AGE_GROUPS.
PYRAMID_1980 = {
    "male": [
        61400, 58300, 70000, 63200, 47500, 35900, 30300, 26500,
        23700, 19700, 17600, 13800, 10500, 7700, 5300, 3000, 1700
    ],
    "female": [
        58200, 55400, 66500, 60500, 45700, 34800, 29400, 25500,
        22500, 18700, 16700, 13300, 10700, 8200, 5800, 3500, 2400
    ]
}

PYRAMID_2020 = {
    "male": [
        43900, 47700, 43500, 36800, 36700, 53000, 64800, 53400,
        50500, 60900, 60500, 52000, 41500, 39500, 25500, 14600, 12000
    ],
    "female": [
        38700, 42500, 38500, 32400, 32700, 49100, 60800, 50700,
        48800, 59800, 60000, 52400, 42400, 41600, 27600, 17000, 18800
    ]
}

PYRAMID_2050 = {  # UN WPP 2024 medium variant
    "male": [
        28100, 30800, 31300, 34900, 33800, 37700, 40400, 41100,
        42400, 49500, 56300, 56800, 56400, 49200, 41600, 41500, 60800
    ],
    "female": [
        24500, 26900, 27400, 30400, 29400, 33000, 35400, 36000,
        37500, 44400, 51900, 53500, 54400, 48500, 41600, 42600, 78600
    ]
}


def build_population_pyramid():
    print("Population pyramid (UN WPP 2024 for 1980, 2020, 2050)...")
    out = {
        "source": "UN WPP 2024 (PopulationByAge5GroupSex, Location=China)",
        "indicator": "Population by 5-year age group and sex (thousands)",
        "ageGroups": PYRAMID_AGE_GROUPS,
        "years": {
            "1980": PYRAMID_1980,
            "2020": PYRAMID_2020,
            "2050": PYRAMID_2050
        }
    }
    write_json("population_pyramid.json", out)


# --- HSR network -----------------------------------------------------------
# Year-end operating length of China's HSR network (km).
# Sources: China State Railway Group annual reports;
# https://en.wikipedia.org/wiki/High-speed_rail_in_China
HSR_KM_BY_YEAR = [
    (2007,   0),
    (2008, 672),     # Beijing–Tianjin Intercity opens Aug 2008
    (2009, 2699),
    (2010, 5133),
    (2011, 6601),
    (2012, 9356),
    (2013, 11028),
    (2014, 16456),
    (2015, 19000),
    (2016, 22000),
    (2017, 25000),
    (2018, 29000),
    (2019, 35000),
    (2020, 37900),
    (2021, 40000),
    (2022, 42000),
    (2023, 45000),
    (2024, 48000),
]

# Approximate length of all other countries' HSR networks combined (km),
# from UIC High-Speed Rail Atlas / Wikipedia compilations.
HSR_REST_OF_WORLD_KM = 27000


def build_hsr_network():
    print("HSR network (China State Railway Group / Wikipedia compilation)...")
    series = [{"year": y, "value": v} for y, v in HSR_KM_BY_YEAR]
    write_json("hsr_network.json", {
        "source": "China State Railway Group annual reports; en.wikipedia.org/wiki/High-speed_rail_in_China",
        "indicator": "High-speed rail network operating length (km)",
        "series": series,
        "rest_of_world_combined_km": HSR_REST_OF_WORLD_KM
    })


def main():
    print(f"Writing into {DATA_DIR}")
    try:
        build_population_total()
    except Exception as exc:
        print(f"  population_total FAILED: {exc}", file=sys.stderr)
    try:
        build_population_pyramid()
    except Exception as exc:
        print(f"  pyramid FAILED: {exc}", file=sys.stderr)
    try:
        build_hsr_network()
    except Exception as exc:
        print(f"  hsr FAILED: {exc}", file=sys.stderr)
    print("Done.")


if __name__ == "__main__":
    main()
