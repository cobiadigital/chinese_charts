import { defaultLayout, defaultConfig, divergingRdBu } from '../chart-utils.js';

export function render(containerId, data) {
  const YEARS = data.years;
  const latest = YEARS[YEARS.length - 1];
  const states = data.states;
  const locations = states.map(s => s.usps);
  const names = states.map(s => s.name);

  const zFor = (year) => states.map(s => s.domesticmig[year]);

  // Symmetric color range based on the largest magnitude across all years.
  const allVals = YEARS.flatMap(y => states.map(s => Math.abs(s.domesticmig[y] || 0)));
  const cap = Math.max(...allVals);

  const trace = {
    type: 'choropleth',
    locationmode: 'USA-states',
    locations,
    z: zFor(latest),
    text: names,
    customdata: names,
    zmin: -cap,
    zmax: cap,
    zmid: 0,
    colorscale: divergingRdBu,
    reversescale: false,
    marker: { line: { color: '#ffffff', width: 0.5 } },
    colorbar: {
      title: { text: 'Net migrants', side: 'right' },
      tickformat: ',.0f',
      thickness: 12
    },
    hovertemplate: '<b>%{customdata}</b><br>Net domestic migration: %{z:+,.0f}<extra></extra>'
  };

  const layout = defaultLayout({
    title: { text: `<b>Net domestic migration by state, ${latest}</b>`, x: 0, font: { size: 16 } },
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
          { 'title.text': `<b>Net domestic migration by state, ${y}</b>` }
        ]
      }))
    }]
  });
  // geo charts don't use cartesian axes; strip them
  delete layout.xaxis;
  delete layout.yaxis;
  delete layout.hovermode;

  Plotly.newPlot(containerId, [trace], layout, defaultConfig());
}
