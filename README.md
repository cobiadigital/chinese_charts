# chinese_charts

Interactive charts on the scale and breadth of China's population changes and
rapid industrialization, ~1950 to today (with UN projections to 2100 where
relevant).

Built with vanilla HTML + ES modules + [Plotly.js](https://plotly.com/javascript/).
No build step. Two pages:

- **`index.html`** — ten charts on China's population & industrialization.
- **`usa_migration.html`** — interactive maps of US domestic migration to and
  from metro and rural areas, 2021–2023.

## View the site locally

ES modules and `fetch()` require an HTTP origin (opening `index.html` over
`file://` won't work):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Refresh the data

Source-of-truth datasets live in `/data` as JSON. Two scripts rebuild them:

```bash
# China page: World Bank + Our World in Data via HTTP
python3 scripts/fetch_data.py

# China page: UN WPP + HSR datasets from compiled values in the script
python3 scripts/compile_manual_data.py

# US migration page: Census PEP + USDA ERS + county GeoJSON (no API key needed)
python3 scripts/fetch_usa_data.py
```

`fetch_data.py` uses `requests` if available, otherwise falls back to the
standard library.

## Charts

| # | Section | Title |
|---|---|---|
| 1 | Population | 1.4 billion, and now shrinking |
| 2 | Population | Births per woman: from 6 to under 1.1 |
| 3 | Population | Age pyramid: 1980 / 2020 / 2050 |
| 4 | Urbanization | From 12% to 65% urban |
| 5 | Economy | GDP growth: four decades of compounding |
| 6 | Economy | From farms to factories to services |
| 7 | Economy | China's share of global manufacturing |
| 8 | Energy | Where China's electricity comes from |
| 9 | Emissions | China vs. the world: annual CO₂ |
| 10 | Infrastructure | Building HSR from zero |

### US migration maps (`usa_migration.html`)

| Section | Visualization |
|---|---|
| States | Choropleth: net domestic migration by state (year toggle) |
| Counties | Choropleth: net domestic migration rate by county (year toggle) |
| Metro vs Rural | Grouped bars: net migration by county type, 2021–2023 |
| Metros | Diverging bars: largest metro gainers & losers, 2023 |

## Layout

```
chinese_charts/
├── index.html              # single scrollytelling page
├── css/styles.css
├── js/
│   ├── main.js             # IntersectionObserver mount + resize
│   ├── data-loader.js      # fetch JSON + error UI
│   ├── chart-utils.js      # defaultLayout, defaultConfig, palette, formatters
│   └── charts/             # one module per chart, exports render(id, data)
├── data/                   # tidy JSON snapshots; source of truth
└── scripts/
    ├── fetch_data.py       # WB + OWID
    └── compile_manual_data.py  # UN WPP + HSR
```

## Sources

- [World Bank Open Data](https://data.worldbank.org/) — CC BY 4.0
- [UN World Population Prospects 2024](https://population.un.org/wpp/)
- [Our World in Data](https://ourworldindata.org/) — CC BY
- High-speed rail length: China State Railway Group annual reports;
  [Wikipedia](https://en.wikipedia.org/wiki/High-speed_rail_in_China)

See `data/README.md` for the indicator code or URL behind each file.
