import { defaultLayout, defaultConfig, palette } from '../chart-utils.js';

export function render(containerId, data) {
  const s = data.series;

  const trace = {
    x: s.map(d => d.year),
    y: s.map(d => d.value),
    type: 'scatter', mode: 'lines',
    name: 'China share',
    fill: 'tozeroy',
    line: { color: palette.china, width: 2.5 },
    fillcolor: 'rgba(214, 39, 40, 0.18)',
    hovertemplate: '%{x}: <b>%{y:.1f}%</b> of global mfg<extra></extra>'
  };

  // Find year where value first exceeds ~17% (rough US share at the time, indicating overtake ~2010)
  const overtake = s.find(d => d.year === 2010);

  const layout = defaultLayout({
    title: { text: "<b>China's share of global manufacturing value added</b>", x: 0, font: { size: 16 } },
    showlegend: false,
    yaxis: Object.assign({}, defaultLayout().yaxis, {
      title: '% of world manufacturing',
      ticksuffix: '%'
    }),
    annotations: overtake ? [{
      x: 2010, y: overtake.value,
      text: '~2010: overtook the US<br>as world\'s largest manufacturer',
      showarrow: true, arrowhead: 2,
      ax: -50, ay: -60,
      font: { size: 11 },
      bgcolor: 'rgba(255,255,255,0.92)',
      bordercolor: palette.china,
      borderwidth: 1
    }] : []
  });

  Plotly.newPlot(containerId, [trace], layout, defaultConfig());
}
