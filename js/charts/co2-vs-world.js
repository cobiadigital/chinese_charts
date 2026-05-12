import { defaultLayout, defaultConfig, palette } from '../chart-utils.js';

export function render(containerId, data) {
  const mk = (arr, name, color, dash) => ({
    x: arr.map(d => d.year),
    y: arr.map(d => d.value),
    type: 'scatter',
    mode: 'lines',
    name,
    line: { color, width: 2.5, dash: dash || 'solid' },
    hovertemplate: `${name}: <b>%{y:,.0f} Mt</b><extra>%{x}</extra>`
  });

  // Filter to 1900+ to keep the x-axis legible
  const filt = (arr) => arr.filter(d => d.year >= 1900);

  const traces = [
    mk(filt(data.world), 'World', palette.world),
    mk(filt(data.china), 'China', palette.china),
    mk(filt(data.usa),   'United States', palette.usa)
  ];

  const layout = defaultLayout({
    title: { text: '<b>Annual CO₂ emissions, million tonnes</b>', x: 0, font: { size: 16 } },
    yaxis: Object.assign({}, defaultLayout().yaxis, {
      title: 'Mt CO₂',
      rangemode: 'tozero'
    }),
    annotations: [{
      x: 2006, y: 6900,
      text: '~2006: China<br>overtakes the US',
      showarrow: true, arrowhead: 2,
      ax: -70, ay: -50,
      font: { size: 11 },
      bgcolor: 'rgba(255,255,255,0.92)',
      bordercolor: palette.china,
      borderwidth: 1
    }]
  });

  Plotly.newPlot(containerId, traces, layout, defaultConfig());
}
