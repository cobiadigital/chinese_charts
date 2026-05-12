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

## Regenerating

```bash
python3 scripts/fetch_data.py           # World Bank + Our World in Data
python3 scripts/compile_manual_data.py  # UN WPP + HSR
```

`fetch_data.py` will fail loudly if a remote endpoint changes shape; check the
console output and update the script.

## License / attribution

- World Bank Open Data: CC BY 4.0
- Our World in Data: CC BY 4.0
- UN World Population Prospects: requires attribution per UN Population Division terms
- HSR figures compiled from multiple sources; treat as approximate
