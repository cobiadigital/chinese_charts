import { defaultLayout, defaultConfig } from '../chart-utils.js';

const IN_DOM = '#08519c';   // domestic in
const IN_INTL = '#41ab5d';  // arrivals from abroad
const OUT = '#cb181d';      // domestic out

function shortName(name) {
  const [place, state] = name.split(', ');
  const first = place.split('-')[0];
  return state ? `${first}, ${state.split('-')[0]}` : first;
}

export function render(containerId, data) {
  // Biggest churn at top: horizontal bars render bottom-up, so sort ascending.
  const metros = data.metros.slice().sort((a, b) => a.gross - b.gross);
  const labels = metros.map(m => shortName(m.name));
  const cd = metros.map(m => [m.in, m.out, m.intl, m.net]);

  const outTrace = {
    type: 'bar', orientation: 'h', name: 'Moved out (domestic)',
    y: labels, x: metros.map(m => -m.out), customdata: cd,
    marker: { color: OUT },
    hovertemplate: '<b>%{y}</b><br>Moved out: %{customdata[1]:,}<br>Moved in (domestic): %{customdata[0]:,}<br>Net domestic: %{customdata[3]:+,}<extra></extra>'
  };
  const inDomTrace = {
    type: 'bar', orientation: 'h', name: 'Moved in (domestic)',
    y: labels, x: metros.map(m => m.in), customdata: cd,
    marker: { color: IN_DOM },
    hovertemplate: '<b>%{y}</b><br>Moved in (domestic): %{customdata[0]:,}<br>Net domestic: %{customdata[3]:+,}<extra></extra>'
  };
  const inIntlTrace = {
    type: 'bar', orientation: 'h', name: 'Arrived from abroad',
    y: labels, x: metros.map(m => m.intl), customdata: cd,
    marker: { color: IN_INTL },
    hovertemplate: '<b>%{y}</b><br>Arrived from abroad: %{customdata[2]:,}<extra></extra>'
  };

  const layout = defaultLayout({
    title: { text: '<b>Migration in and out, top metros (2016 to 2020)</b>', x: 0, font: { size: 16 } },
    barmode: 'relative',
    bargap: 0.25,
    xaxis: Object.assign({}, defaultLayout().xaxis, {
      title: 'people: moved out (left) vs moved in (right)',
      tickvals: [-1000000, -750000, -500000, -250000, 0, 250000, 500000, 750000],
      ticktext: ['1.0M', '750K', '500K', '250K', '0', '250K', '500K', '750K'],
      zeroline: true,
      zerolinecolor: '#5a5a5a',
      zerolinewidth: 1.5
    }),
    yaxis: Object.assign({}, defaultLayout().yaxis, {
      title: '',
      automargin: true,
      tickfont: { size: 11 }
    }),
    legend: Object.assign({}, defaultLayout().legend, { y: -0.12 }),
    margin: { l: 10, r: 20, t: 40, b: 70 }
  });

  Plotly.newPlot(containerId, [outTrace, inDomTrace, inIntlTrace], layout, defaultConfig());
}
