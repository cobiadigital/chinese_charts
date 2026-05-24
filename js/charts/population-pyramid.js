import { defaultLayout, defaultConfig, palette } from '../chart-utils.js';

export function render(containerId, data) {
  const groups = data.ageGroups;
  const years = ['1980', '2020', '2050'];
  const initial = '2020';

  // thousands -> millions; negative for males so they appear on the left
  const maleMillions = (y) => data.years[y].male.map(v => -v / 1000);
  const femaleMillions = (y) => data.years[y].female.map(v => v / 1000);
  const maleAbs = (y) => data.years[y].male.map(v => v / 1000);

  const initialTraces = [
    {
      x: maleMillions(initial),
      y: groups,
      name: 'Male',
      type: 'bar',
      orientation: 'h',
      marker: { color: palette.male },
      customdata: maleAbs(initial),
      hovertemplate: '%{y} (M): <b>%{customdata:.2f}M</b><extra></extra>'
    },
    {
      x: femaleMillions(initial),
      y: groups,
      name: 'Female',
      type: 'bar',
      orientation: 'h',
      marker: { color: palette.female },
      hovertemplate: '%{y} (F): <b>%{x:.2f}M</b><extra></extra>'
    }
  ];

  const maxAcrossYears = Math.max(
    ...years.flatMap(y => [
      ...data.years[y].male,
      ...data.years[y].female
    ])
  ) / 1000;
  const xRange = Math.ceil(maxAcrossYears / 10) * 10;

  const layout = defaultLayout({
    title: { text: `<b>China age pyramid, ${initial}</b>`, x: 0, font: { size: 16 } },
    barmode: 'overlay',
    bargap: 0.05,
    xaxis: Object.assign({}, defaultLayout().xaxis, {
      title: 'Population (millions)',
      tickvals: [-80, -60, -40, -20, 0, 20, 40, 60, 80],
      ticktext: ['80', '60', '40', '20', '0', '20', '40', '60', '80'],
      range: [-xRange, xRange]
    }),
    yaxis: Object.assign({}, defaultLayout().yaxis, {
      title: 'Age group',
      categoryorder: 'array',
      categoryarray: groups
    }),
    updatemenus: [{
      type: 'buttons',
      direction: 'right',
      x: 0, y: 1.16,
      xanchor: 'left',
      yanchor: 'top',
      pad: { r: 6, t: 4 },
      showactive: true,
      bgcolor: 'rgba(255,255,255,0.85)',
      bordercolor: palette.world,
      buttons: years.map(y => ({
        label: y,
        method: 'update',
        args: [
          {
            x: [maleMillions(y), femaleMillions(y)],
            customdata: [maleAbs(y), null]
          },
          {
            'title.text': `<b>China age pyramid, ${y}</b>`
          }
        ]
      }))
    }]
  });

  Plotly.newPlot(containerId, initialTraces, layout, defaultConfig());
}
