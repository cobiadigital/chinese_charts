import { defaultLayout, defaultConfig, palette } from '../chart-utils.js';

export function render(containerId, data) {
  const s = data.series.filter(d => d.year >= 1978);
  const colors = s.map(d => d.value < 0 ? palette.negative : palette.china);

  const trace = {
    x: s.map(d => d.year),
    y: s.map(d => d.value),
    type: 'bar',
    name: 'GDP growth (annual %)',
    marker: { color: colors },
    hovertemplate: '%{x}: <b>%{y:.1f}%</b><extra></extra>'
  };

  const layout = defaultLayout({
    title: { text: '<b>China real GDP growth, annual %</b>', x: 0, font: { size: 16 } },
    showlegend: false,
    yaxis: Object.assign({}, defaultLayout().yaxis, {
      title: 'Annual % change',
      ticksuffix: '%',
      zeroline: true,
      zerolinecolor: '#5a5a5a'
    }),
    annotations: [
      {
        x: 2008, y: 9.7,
        text: '2008<br>GFC',
        showarrow: true, arrowhead: 2,
        ax: 0, ay: -50,
        font: { size: 10 },
        bgcolor: 'rgba(255,255,255,0.85)'
      },
      {
        x: 2020, y: 2.2,
        text: '2020<br>COVID',
        showarrow: true, arrowhead: 2,
        ax: 0, ay: -60,
        font: { size: 10 },
        bgcolor: 'rgba(255,255,255,0.85)'
      }
    ]
  });

  Plotly.newPlot(containerId, [trace], layout, defaultConfig());
}
