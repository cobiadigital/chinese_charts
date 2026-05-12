import { defaultLayout, defaultConfig, palette } from '../chart-utils.js';

export function render(containerId, data) {
  const s = data.series;
  const years = s.map(d => d.year);
  const urban = s.map(d => d.value);
  const rural = s.map(d => 100 - d.value);

  const urbanTrace = {
    x: years, y: urban,
    type: 'scatter', mode: 'lines',
    name: 'Urban',
    stackgroup: 'one',
    line: { width: 0 },
    fillcolor: palette.urban,
    hovertemplate: '%{x}: <b>%{y:.1f}%</b> urban<extra></extra>'
  };
  const ruralTrace = {
    x: years, y: rural,
    type: 'scatter', mode: 'lines',
    name: 'Rural',
    stackgroup: 'one',
    line: { width: 0 },
    fillcolor: palette.rural,
    hovertemplate: '%{x}: <b>%{y:.1f}%</b> rural<extra></extra>'
  };

  // Find crossover year (first year urban > rural)
  let crossover = null;
  for (let i = 0; i < s.length; i++) {
    if (s[i].value > 50) { crossover = s[i].year; break; }
  }

  const layout = defaultLayout({
    title: { text: '<b>Urban vs. rural population share</b>', x: 0, font: { size: 16 } },
    yaxis: Object.assign({}, defaultLayout().yaxis, {
      title: '% of population',
      range: [0, 100],
      ticksuffix: '%'
    }),
    annotations: crossover ? [{
      x: crossover, y: 50,
      text: `Urban overtakes rural: ${crossover}`,
      showarrow: true,
      arrowhead: 2,
      ax: 60, ay: -50,
      font: { size: 11, color: '#1a1a1a' },
      bgcolor: 'rgba(255,255,255,0.92)',
      bordercolor: palette.china,
      borderwidth: 1
    }] : []
  });

  Plotly.newPlot(containerId, [ruralTrace, urbanTrace], layout, defaultConfig());
}
