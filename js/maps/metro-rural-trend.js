import { defaultLayout, defaultConfig } from '../chart-utils.js';

// Sequential blue ramp; later years are darker.
const YEAR_RAMP = ['#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'];

export function render(containerId, data) {
  const buckets = data.buckets;
  const years = data.years;
  const colorFor = (i) => YEAR_RAMP[Math.round(i * (YEAR_RAMP.length - 1) / Math.max(1, years.length - 1))];

  const traces = years.map((y, i) => ({
    type: 'bar',
    name: y,
    x: buckets,
    y: buckets.map(b => data.totals[b][y]),
    marker: { color: colorFor(i) },
    hovertemplate: `${y} &mdash; %{x}<br>Net migration: %{y:+,.0f}<extra></extra>`
  }));

  const span = `${years[0]}&ndash;${years[years.length - 1]}`;
  const layout = defaultLayout({
    title: { text: `<b>Net domestic migration by county type, ${span}</b>`, x: 0, font: { size: 16 } },
    barmode: 'group',
    yaxis: Object.assign({}, defaultLayout().yaxis, {
      title: 'Net domestic migrants',
      tickformat: ',.0f',
      zeroline: true,
      zerolinecolor: '#5a5a5a',
      zerolinewidth: 1.5
    }),
    xaxis: Object.assign({}, defaultLayout().xaxis, { title: '' })
  });

  Plotly.newPlot(containerId, traces, layout, defaultConfig());
}
