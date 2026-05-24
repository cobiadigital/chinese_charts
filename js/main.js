// Entrypoint: lazy-mount charts as they scroll into view.

import { loadJSON, showError, showLoading, clearState } from './data-loader.js';

// Bump on each deploy so browsers fetch fresh modules/data instead of cache.
const APP_VERSION = '20260524b';
const bust = (p) => `${p}${p.includes('?') ? '&' : '?'}v=${APP_VERSION}`;

const charts = [
  { id: 'chart-population-total',   module: './charts/population-total.js',   data: 'data/population_total.json' },
  { id: 'chart-fertility-rate',     module: './charts/fertility-rate.js',     data: 'data/fertility_rate.json' },
  { id: 'chart-population-pyramid', module: './charts/population-pyramid.js', data: 'data/population_pyramid.json' },
  { id: 'chart-urban-rural',        module: './charts/urban-rural.js',        data: 'data/urban_rural.json' },
  { id: 'chart-gdp-growth',         module: './charts/gdp-growth.js',         data: 'data/gdp_growth.json' },
  { id: 'chart-sector-shares',      module: './charts/sector-shares.js',      data: 'data/sector_shares.json' },
  { id: 'chart-mfg-share-global',   module: './charts/mfg-share-global.js',   data: 'data/mfg_share_global.json' },
  { id: 'chart-electricity-mix',    module: './charts/electricity-mix.js',    data: 'data/electricity_mix.json' },
  { id: 'chart-co2-vs-world',       module: './charts/co2-vs-world.js',       data: 'data/co2_emissions.json' },
  { id: 'chart-hsr-network',        module: './charts/hsr-network.js',        data: 'data/hsr_network.json' }
];

const rendered = new Set();

async function mount(entry) {
  if (rendered.has(entry.id)) return;
  rendered.add(entry.id);
  const el = document.getElementById(entry.id);
  if (!el) return;
  showLoading(entry.id);
  try {
    const [mod, data] = await Promise.all([
      import(bust(entry.module)),
      loadJSON(bust(entry.data))
    ]);
    clearState(entry.id);
    mod.render(entry.id, data);
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

// Re-fit Plotly charts on resize (debounced).
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
