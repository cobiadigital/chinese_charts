import { defaultLayout, defaultConfig, palette, fmt } from '../chart-utils.js';

export function render(containerId, data) {
  const est = data.estimates;
  const proj = data.projection;

  const estTrace = {
    x: est.map(d => d.year),
    y: est.map(d => d.value),
    type: 'scatter',
    mode: 'lines',
    name: 'Estimates',
    line: { color: palette.china, width: 2.5 },
    hovertemplate: '%{x}: <b>%{y:.1f}M</b><extra></extra>'
  };

  const projTrace = {
    x: proj.map(d => d.year),
    y: proj.map(d => d.value),
    type: 'scatter',
    mode: 'lines',
    name: 'Projection (UN medium)',
    line: { color: palette.china, width: 2.5, dash: 'dot' },
    hovertemplate: '%{x}: <b>%{y:.1f}M</b><extra></extra>'
  };

  const layout = defaultLayout({
    title: { text: '<b>China total population, 1950 to 2100</b>', x: 0, font: { size: 16 } },
    xaxis: Object.assign({}, defaultLayout().xaxis, { title: '' }),
    yaxis: Object.assign({}, defaultLayout().yaxis, {
      title: 'Population (millions)',
      tickformat: ',.0f'
    }),
    annotations: [{
      x: 2022, y: 1411,
      xref: 'x', yref: 'y',
      text: 'Peak: 2022',
      showarrow: true,
      arrowhead: 2,
      ax: 60, ay: -40,
      font: { color: palette.china, size: 12 },
      bgcolor: 'rgba(255,255,255,0.85)',
      bordercolor: palette.china,
      borderwidth: 1
    }],
    shapes: [{
      type: 'line',
      x0: 2022, x1: 2022,
      y0: 0, y1: 1450,
      yref: 'y',
      line: { color: palette.china, width: 1, dash: 'dash' },
      opacity: 0.4
    }]
  });

  Plotly.newPlot(containerId, [estTrace, projTrace], layout, defaultConfig());
}
