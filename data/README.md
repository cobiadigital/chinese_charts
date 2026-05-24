# Data provenance

All files in this directory are tidy JSON snapshots and are the source of
truth used by the charts. Regenerate them with the scripts in `/scripts`.

| File | Source | Identifier / URL |
|---|---|---|
| `population_total.json` | UN WPP 2024 + World Bank | UN WPP 2024 historical 1950–1959; World Bank `SP.POP.TOTL` 1960–latest; UN WPP 2024 medium-variant projection 2024–2100 |
| `fertility_rate.json` | World Bank | `SP.DYN.TFRT.IN` (`api.worldbank.org/v2/country/CHN/indicator/SP.DYN.TFRT.IN`) |
| `population_pyramid.json` | UN WPP 2024 | PopulationByAge5GroupSex, Location=China, Years 1980 / 2020 / 2050 (medium variant) |
| `urban_rural.json` | World Bank | `SP.URB.TOTL.IN.ZS` |
| `gdp_growth.json` | World Bank | `NY.GDP.MKTP.KD.ZG` |
| `sector_shares.json` | World Bank | `NV.AGR.TOTL.ZS`, `NV.IND.TOTL.ZS`, `NV.SRV.TOTL.ZS` |
| `mfg_share_global.json` | World Bank | `NV.IND.MANF.CD` (CHN ÷ WLD × 100) |
| `electricity_mix.json` | Our World in Data | `electricity-prod-source-stacked.csv` filtered to Code=CHN |
| `co2_emissions.json` | Our World in Data | `owid-co2-data.csv`, columns `country, year, co2`; kept China / World / United States |
| `hsr_network.json` | China State Railway Group + Wikipedia | Year-end operating length 2007–2024 |

## US migration maps (`usa/`)

| File | Source | Notes |
|---|---|---|
| `usa/state_migration.json` | Census PEP Vintage 2025 (`co-est2025-alldata`) | Net domestic migration by state, 2021–2025 |
| `usa/county_migration.json` | Census PEP Vintage 2025 (`co-est2025-alldata`) | Net domestic migration RATE per 1,000, by county FIPS |
| `usa/metro_rural_trend.json` | Census PEP + USDA ERS RUCC 2023 | Net domestic migration summed by Rural-Urban Continuum bucket |
| `usa/top_metros.json` | Census PEP Vintage 2025 (`cbsa-est2025-alldata`) | Largest metro (MSA) gainers & losers, 2025 |
| `usa/counties-fips.geojson` | Plotly datasets | County boundaries keyed by FIPS `id` |

None of the US sources require an API key — they are bulk CSVs from
`www2.census.gov` and `ers.usda.gov`, plus a GeoJSON from GitHub.

## Regenerating

```bash
python3 scripts/fetch_data.py           # China: World Bank + Our World in Data
python3 scripts/compile_manual_data.py  # China: UN WPP + HSR
python3 scripts/fetch_usa_data.py       # US migration: Census + USDA + GeoJSON
```

`fetch_data.py` will fail loudly if a remote endpoint changes shape; check the
console output and update the script.

## License / attribution

- World Bank Open Data: CC BY 4.0
- Our World in Data: CC BY 4.0
- UN World Population Prospects: requires attribution per UN Population Division terms
- HSR figures compiled from multiple sources; treat as approximate
