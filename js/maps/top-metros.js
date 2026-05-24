import { defaultLayout, defaultConfig } from '../chart-utils.js';

const GAIN = '#08519c';
const LOSS = '#cb181d';

function shortName(name) {
  // "Dallas-Fort Worth-Arlington, TX" -> "Dallas, TX"
  const [place, state] = name.split(', ');
  const first = place.split('-')[0];
  return state ? `${first}, ${state}` : first;
}

export function render(containerId, data) {
  const year = data.year;
  // Combine top gainers and losers into one diverging bar, sorted ascending
  // so the biggest gainer sits at the top.
  const rows = [...data.losers, ...data.gainers];
  // de-dup by name, then sort by value ascending (Plotly horizontal bars
  // render bottom-up, so ascending puts largest gainer at top)
  const seen = new Set();
  const uniq = [];
  for (const r of rows) {
    if (seen.has(r.name)) continue;
    seen.add(r.name);
    uniq.push(r);
  }
  uniq.sort((a, b) => a.domesticmig - b.domesticmig);

  const trace = {
    type: 'bar',
    orientation: 'h',
    x: uniq.map(r => r.domesticmig),
    y: uniq.map(r => shortName(r.name)),
    customdata: uniq.map(r => r.name),
    marker: { color: uniq.map(r => r.domesticmig >= 0 ? GAIN : LOSS) },
    hovertemplate: '<b>%{customdata}</b><br>Net domestic migration: %{x:+,.0f}<extra></extra>'
  };

  const layout = defaultLayout({
    title: { text: `<b>Largest metro gainers and losers, ${year}</b>`, x: 0, font: { size: 16 } },
    showlegend: false,
    bargap: 0.25,
    xaxis: Object.assign({}, defaultLayout().xaxis, {
      title: 'Net domestic migration (people)',
      tickformat: ',.0f',
      zeroline: true,
      zerolinecolor: '#5a5a5a',
      zerolinewidth: 1.5
    }),
    yaxis: Object.assign({}, defaultLayout().yaxis, {
      title: '',
      automargin: true,
      tickfont: { size: 11 }
    }),
    margin: { l: 10, r: 20, t: 40, b: 50 }
  });

  Plotly.newPlot(containerId, [trace], layout, defaultConfig());
}
