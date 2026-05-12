import { defaultLayout, defaultConfig, palette } from '../chart-utils.js';

export function render(containerId, data) {
  const s = data.series;
  const restOfWorld = data.rest_of_world_combined_km;

  const trace = {
    x: s.map(d => d.year),
    y: s.map(d => d.value),
    type: 'scatter',
    mode: 'lines+markers',
    name: 'China HSR',
    line: { color: palette.china, width: 3, shape: 'hv' },
    marker: { size: 6, color: palette.china },
    fill: 'tozeroy',
    fillcolor: 'rgba(214, 39, 40, 0.15)',
    hovertemplate: '%{x}: <b>%{y:,} km</b><extra></extra>'
  };

  const maxY = Math.max(...s.map(d => d.value));

  const layout = defaultLayout({
    title: { text: '<b>China high-speed rail network length</b>', x: 0, font: { size: 16 } },
    showlegend: false,
    yaxis: Object.assign({}, defaultLayout().yaxis, {
      title: 'Operating length (km)',
      tickformat: ',',
      rangemode: 'tozero'
    }),
    shapes: [{
      type: 'line',
      x0: s[0].year, x1: s[s.length - 1].year,
      y0: restOfWorld, y1: restOfWorld,
      line: { color: palette.world, width: 1.5, dash: 'dash' }
    }],
    annotations: [
      {
        x: s[s.length - 1].year,
        y: restOfWorld,
        xanchor: 'right',
        yanchor: 'bottom',
        text: `Rest of world combined ≈ ${restOfWorld.toLocaleString()} km`,
        showarrow: false,
        font: { size: 11, color: palette.world },
        bgcolor: 'rgba(255,255,255,0.85)'
      },
      {
        x: s[s.length - 1].year,
        y: maxY,
        xanchor: 'right',
        yanchor: 'top',
        text: `${maxY.toLocaleString()} km<br>(${s[s.length - 1].year})`,
        showarrow: false,
        font: { size: 12, color: palette.china },
        bgcolor: 'rgba(255,255,255,0.92)',
        bordercolor: palette.china,
        borderwidth: 1
      }
    ]
  });

  Plotly.newPlot(containerId, [trace], layout, defaultConfig());
}
