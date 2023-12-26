import type { Chart } from 'chart.js';

export interface TrackbearStylesPluginOptions {
  enabled?: boolean;
  ignorePar?: boolean;
}

function makeTrackbearStylesPlugin(getColor) {
  const POINT_STYLES = ['circle', 'rect', 'crossRot', 'rectRot', 'triangle', 'star', 'rectRounded', 'cross'];
  const LINE_COLORS = [ getColor('primary'), getColor('danger'), getColor('info'), getColor('warning') ];

  const PAR_COLOR = getColor('success');
  const PAR_BORDER_DASH = [ 8 ];

  // This is with heavy copying from https://github.com/chartjs/Chart.js/blob/master/src/plugins/plugin.colors.ts
  return {
    id: 'trackbear-stypes',
    defaults: {
      enabled: true,
      ignorePar: false,
    } as TrackbearStylesPluginOptions,

    beforeLayout(chart: Chart<'line'>, _args, options: TrackbearStylesPluginOptions) {
      if(!options.enabled) {
        return;
      }

      chart.config.options.color = getColor('secondary');

      // configure axes and grids
      Object.keys(chart.config.options.scales).forEach(scaleId => {
        chart.config.options.scales[scaleId].grid.color = getColor('backgroundBorder');
        chart.config.options.scales[scaleId].ticks.color = getColor('secondary');
      });

      // configure dataset colors and points
      chart.config.data.datasets.forEach((dataset, ix) => {
        if(!options.ignorePar && dataset.label === 'Par') {
          dataset.borderColor = PAR_COLOR;
          dataset.pointStyle = false;
          dataset.borderDash = PAR_BORDER_DASH;
        } else {
          dataset.borderColor = LINE_COLORS[ix % LINE_COLORS.length];
          dataset.backgroundColor = LINE_COLORS[ix % LINE_COLORS.length];
          dataset.pointStyle = POINT_STYLES[Math.floor(ix / LINE_COLORS.length)];
        }
      });
    }

  }
}

export default makeTrackbearStylesPlugin;
