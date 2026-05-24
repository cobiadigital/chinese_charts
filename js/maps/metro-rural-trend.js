import { defaultLayout, defaultConfig } from '../chart-utils.js';

const YEAR_COLORS = {
  '2021': '#9ecae1',
  '2022': '#4292c6',
  '2023': '#08519c'
};

export function render(containerId, data) {
  const buckets = data.buckets;
  const years = data.years;

  const traces = years.map(y => ({
    type: 'bar',
    name: y,
    x: buckets,
    y: buckets.map(b => data.totals[b][y]),
    marker: { color: YEAR_COLORS[y] || '#4292c6' },
    hovertemplate: `${y} &mdash; %{x}<br>Net migration: %{y:+,.0f}<extra></extra>`
  }));

  const layout = defaultLayout({
    title: { text: '<b>Net domestic migration by county type, 2021&ndash;2023</b>', x: 0, font: { size: 16 } },
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
