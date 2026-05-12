import { defaultLayout, defaultConfig, palette } from '../chart-utils.js';

export function render(containerId, data) {
  const yearsSet = new Set([
    ...data.agriculture.map(d => d.year),
    ...data.industry.map(d => d.year),
    ...data.services.map(d => d.year)
  ]);
  const years = [...yearsSet].sort();
  const lookup = (series) => Object.fromEntries(series.map(d => [d.year, d.value]));
  const agr = lookup(data.agriculture);
  const ind = lookup(data.industry);
  const srv = lookup(data.services);

  // Keep only years with all three present
  const ys = years.filter(y => agr[y] != null && ind[y] != null && srv[y] != null);

  const makeTrace = (name, vals, color) => ({
    x: ys, y: vals,
    type: 'scatter', mode: 'lines',
    name,
    stackgroup: 'one',
    groupnorm: 'percent',
    line: { width: 0 },
    fillcolor: color,
    hovertemplate: `${name}: <b>%{y:.1f}%</b><extra></extra>`
  });

  const traces = [
    makeTrace('Agriculture', ys.map(y => agr[y]), palette.agriculture),
    makeTrace('Industry', ys.map(y => ind[y]), palette.industry),
    makeTrace('Services', ys.map(y => srv[y]), palette.services)
  ];

  const layout = defaultLayout({
    title: { text: '<b>Value added by sector (% of GDP)</b>', x: 0, font: { size: 16 } },
    yaxis: Object.assign({}, defaultLayout().yaxis, {
      title: 'Share of value added',
      ticksuffix: '%',
      range: [0, 100]
    })
  });

  Plotly.newPlot(containerId, traces, layout, defaultConfig());
}
