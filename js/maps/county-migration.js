import { defaultLayout, defaultConfig, divergingRdBu } from '../chart-utils.js';

export function render(containerId, data, geojson) {
  const YEARS = data.years;
  const latest = YEARS[YEARS.length - 1];
  const counties = data.counties;
  const locations = counties.map(c => c.fips);
  const names = counties.map(c => c.name);

  const zFor = (year) => counties.map(c => {
    const v = c.rate[year];
    return v == null ? null : v;
  });

  // Clamp color range to a robust value so a few extreme rural counties
  // (tiny denominators) don't wash out the map.
  const cap = 30; // per 1,000 residents

  const trace = {
    type: 'choropleth',
    geojson,
    featureidkey: 'id',
    locations,
    z: zFor(latest),
    customdata: names,
    zmin: -cap,
    zmax: cap,
    zmid: 0,
    colorscale: divergingRdBu,
    marker: { line: { width: 0 } },
    colorbar: {
      title: { text: 'Net migr.<br>per 1,000', side: 'right' },
      thickness: 12,
      tickvals: [-30, -15, 0, 15, 30],
      ticktext: ['-30', '-15', '0', '+15', '+30+']
    },
    hovertemplate: '<b>%{customdata}</b><br>Net migration rate: %{z:+.1f} / 1,000<extra></extra>'
  };

  const layout = defaultLayout({
    title: { text: `<b>Net domestic migration rate by county &mdash; ${latest}</b>`, x: 0, font: { size: 16 } },
    geo: {
      scope: 'usa',
      bgcolor: 'rgba(0,0,0,0)',
      lakecolor: 'rgba(0,0,0,0)',
      showlakes: false
    },
    margin: { l: 0, r: 0, t: 40, b: 0 },
    updatemenus: [{
      type: 'buttons',
      direction: 'right',
      x: 0, y: 1.08,
      xanchor: 'left', yanchor: 'top',
      pad: { r: 6, t: 4 },
      showactive: true,
      bgcolor: 'rgba(255,255,255,0.85)',
      bordercolor: '#7F7F7F',
      buttons: YEARS.map(y => ({
        label: y,
        method: 'update',
        args: [
          { z: [zFor(y)] },
          { 'title.text': `<b>Net domestic migration rate by county &mdash; ${y}</b>` }
        ]
      }))
    }]
  });
  delete layout.xaxis;
  delete layout.yaxis;
  delete layout.hovermode;

  Plotly.newPlot(containerId, [trace], layout, defaultConfig());
}
