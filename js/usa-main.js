// Entrypoint for the US migration maps page.
// Lazy-mounts each map/chart as it scrolls into view.

import { loadJSON, showError, showLoading, clearState } from './data-loader.js';

const charts = [
  {
    id: 'map-state-migration',
    module: './maps/state-migration.js',
    data: 'data/usa/state_migration.json'
  },
  {
    id: 'map-county-migration',
    module: './maps/county-migration.js',
    data: 'data/usa/county_migration.json',
    geojson: 'data/usa/counties-fips.geojson'
  },
  {
    id: 'chart-metro-rural-trend',
    module: './maps/metro-rural-trend.js',
    data: 'data/usa/metro_rural_trend.json'
  },
  {
    id: 'chart-top-metros',
    module: './maps/top-metros.js',
    data: 'data/usa/top_metros.json'
  }
];

const rendered = new Set();

async function mount(entry) {
  if (rendered.has(entry.id)) return;
  rendered.add(entry.id);
  const el = document.getElementById(entry.id);
  if (!el) return;
  showLoading(entry.id);
  try {
    const jobs = [import(entry.module), loadJSON(entry.data)];
    if (entry.geojson) jobs.push(loadJSON(entry.geojson));
    const [mod, data, geojson] = await Promise.all(jobs);
    clearState(entry.id);
    mod.render(entry.id, data, geojson);
  } catch (err) {
    console.error(`[${entry.id}]`, err);
    showError(entry.id, err);
  }
}

const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      const cfg = charts.find((c) => c.id === e.target.id);
      if (cfg) mount(cfg);
      io.unobserve(e.target);
    }
  }
}, { rootMargin: '200px' });

for (const c of charts) {
  const el = document.getElementById(c.id);
  if (el) io.observe(el);
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    for (const c of charts) {
      const el = document.getElementById(c.id);
      if (el && rendered.has(c.id) && window.Plotly) {
        window.Plotly.Plots.resize(el);
      }
    }
  }, 200);
});
