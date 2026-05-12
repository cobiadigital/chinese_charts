import { defaultLayout, defaultConfig, palette } from '../chart-utils.js';

const SOURCE_ORDER = ['Coal', 'Gas', 'Oil', 'Nuclear', 'Hydropower', 'Bioenergy', 'Wind', 'Solar', 'Other renewables'];
const COLORS = {
  'Coal': palette.coal,
  'Gas': palette.gas,
  'Oil': palette.oil,
  'Nuclear': palette.nuclear,
  'Hydropower': palette.hydro,
  'Bioenergy': palette.bioOther,
  'Wind': palette.wind,
  'Solar': palette.solar,
  'Other renewables': '#bcbd22'
};

export function render(containerId, data) {
  const sources = data.sources;
  const allYearsSet = new Set();
  for (const src of Object.values(sources)) {
    for (const r of src) allYearsSet.add(r.year);
  }
  const years = [...allYearsSet].sort();
  // Drop trailing partial / zero year if needed (e.g. 2025 may be incomplete)
  // Keep all, but warn in console if total drops > 50% YoY at the tail
  const lookup = (arr) => Object.fromEntries(arr.map(r => [r.year, r.value]));
  const data_by_source = Object.fromEntries(
    SOURCE_ORDER.filter(s => sources[s]).map(s => [s, lookup(sources[s])])
  );

  const buildTraces = (mode) => SOURCE_ORDER.filter(s => sources[s]).map(s => ({
    x: years,
    y: years.map(y => data_by_source[s][y] ?? 0),
    type: 'scatter',
    mode: 'lines',
    name: s,
    stackgroup: 'one',
    groupnorm: mode === 'percent' ? 'percent' : '',
    line: { width: 0 },
    fillcolor: COLORS[s] || palette.world,
    hovertemplate: `${s}: <b>%{y:.0f}${mode === 'percent' ? '%' : ' TWh'}</b><extra></extra>`
  }));

  const layout = defaultLayout({
    title: { text: '<b>China electricity generation by source</b>', x: 0, font: { size: 16 } },
    yaxis: Object.assign({}, defaultLayout().yaxis, {
      title: 'TWh',
      rangemode: 'tozero'
    }),
    updatemenus: [{
      type: 'buttons',
      direction: 'right',
      x: 0, y: 1.18,
      xanchor: 'left',
      yanchor: 'top',
      pad: { r: 6, t: 4 },
      bgcolor: 'rgba(255,255,255,0.85)',
      bordercolor: palette.world,
      showactive: true,
      buttons: [
        {
          label: 'Absolute (TWh)',
          method: 'update',
          args: [
            { groupnorm: SOURCE_ORDER.filter(s => sources[s]).map(_ => '') },
            { 'yaxis.title.text': 'TWh', 'yaxis.ticksuffix': '' }
          ]
        },
        {
          label: 'Share (%)',
          method: 'update',
          args: [
            { groupnorm: SOURCE_ORDER.filter(s => sources[s]).map(_ => 'percent') },
            { 'yaxis.title.text': '% of generation', 'yaxis.ticksuffix': '%' }
          ]
        }
      ]
    }]
  });

  Plotly.newPlot(containerId, buildTraces('abs'), layout, defaultConfig());
}
