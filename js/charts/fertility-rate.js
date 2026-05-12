import { defaultLayout, defaultConfig, palette } from '../chart-utils.js';

export function render(containerId, data) {
  const s = data.series;

  const trace = {
    x: s.map(d => d.year),
    y: s.map(d => d.value),
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Births per woman',
    line: { color: palette.china, width: 2.5 },
    marker: { size: 4 },
    hovertemplate: '%{x}: <b>%{y:.2f}</b><extra></extra>'
  };

  const policy = [
    { year: 1979, label: 'One-child policy', ay: -90 },
    { year: 2016, label: 'Two-child policy', ay: -60 },
    { year: 2021, label: 'Three-child policy', ay: -30 }
  ];

  const layout = defaultLayout({
    title: { text: '<b>China total fertility rate</b>', x: 0, font: { size: 16 } },
    showlegend: false,
    yaxis: Object.assign({}, defaultLayout().yaxis, {
      title: 'Births per woman',
      range: [0, 7]
    }),
    annotations: [
      ...policy.map(p => ({
        x: p.year,
        y: (s.find(d => d.year === p.year) || s[s.length - 1]).value,
        text: p.label,
        showarrow: true,
        arrowhead: 2,
        ax: 0, ay: p.ay,
        font: { size: 11, color: palette.china },
        bgcolor: 'rgba(255,255,255,0.85)',
        bordercolor: palette.china,
        borderwidth: 1
      })),
      {
        x: s[s.length - 1].year, y: 2.1,
        xanchor: 'right',
        text: 'Replacement level (2.1)',
        showarrow: false,
        font: { size: 10, color: palette.world },
        bgcolor: 'rgba(255,255,255,0.85)'
      }
    ],
    shapes: [{
      type: 'line',
      x0: s[0].year, x1: s[s.length - 1].year,
      y0: 2.1, y1: 2.1,
      line: { color: palette.world, width: 1, dash: 'dash' }
    }]
  });

  Plotly.newPlot(containerId, [trace], layout, defaultConfig());
}
