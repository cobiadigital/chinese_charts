// Shared Plotly defaults, palette, formatters.
// All chart modules import from here.

export const palette = {
  china: '#D62728',
  chinaSoft: 'rgba(214, 39, 40, 0.18)',
  world: '#7F7F7F',
  usa: '#1f77b4',
  agriculture: '#8c564b',
  industry: '#ff7f0e',
  services: '#1f77b4',
  coal: '#3b3b3b',
  gas: '#a18a5a',
  oil: '#6b3a1a',
  hydro: '#1f77b4',
  nuclear: '#9467bd',
  wind: '#2ca02c',
  solar: '#ffbb33',
  bioOther: '#bcbd22',
  urban: '#D62728',
  rural: '#bcbd22',
  male: '#1f77b4',
  female: '#D62728',
  positive: '#2ca02c',
  negative: '#D62728'
};

const isMobile = () => window.matchMedia('(max-width: 640px)').matches;

const cssVar = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

export function defaultLayout(overrides = {}) {
  const fg = cssVar('--fg', '#1a1a1a');
  const muted = cssVar('--muted', '#5a5a5a');
  const border = cssVar('--border', '#e5e5e5');
  const bg = cssVar('--bg', '#ffffff');
  return Object.assign({
    paper_bgcolor: bg,
    plot_bgcolor: bg,
    font: {
      family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: fg,
      size: isMobile() ? 11 : 13
    },
    margin: { l: 60, r: 20, t: 40, b: 50 },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: bg,
      bordercolor: border,
      font: { color: fg, size: 13 }
    },
    xaxis: {
      gridcolor: border,
      linecolor: border,
      tickcolor: border,
      zeroline: false,
      color: muted
    },
    yaxis: {
      gridcolor: border,
      linecolor: border,
      tickcolor: border,
      zeroline: false,
      color: muted
    },
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: -0.25,
      xanchor: 'center',
      x: 0.5,
      font: { color: fg }
    }
  }, overrides);
}

export function defaultConfig(overrides = {}) {
  return Object.assign({
    responsive: true,
    displaylogo: false,
    displayModeBar: !isMobile(),
    modeBarButtonsToRemove: [
      'lasso2d', 'select2d', 'autoScale2d',
      'hoverClosestCartesian', 'hoverCompareCartesian',
      'toggleSpikelines'
    ],
    toImageButtonOptions: { format: 'png', filename: 'china-chart', scale: 2 }
  }, overrides);
}

// Diverging red-white-blue scale for net-migration maps.
// Negative (out-migration) = red, zero = white, positive (in-migration) = blue.
export const divergingRdBu = [
  [0.0, '#67000d'],
  [0.15, '#cb181d'],
  [0.35, '#fb6a4a'],
  [0.5, '#f7f7f7'],
  [0.65, '#6baed6'],
  [0.85, '#2171b5'],
  [1.0, '#08306b']
];

export const fmt = {
  millions: (n) => (n / 1e6).toFixed(0) + 'M',
  signed: (n) => (n > 0 ? '+' : '') + Math.round(n).toLocaleString(),
  billions: (n) => (n / 1e9).toFixed(2) + 'B',
  popB: (n) => (n / 1000).toFixed(2) + 'B', // input is millions
  popM: (n) => n.toFixed(0) + 'M',          // input is millions
  pct: (n) => n.toFixed(1) + '%',
  comma: (n) => Math.round(n).toLocaleString(),
  twh: (n) => n.toFixed(0) + ' TWh'
};
