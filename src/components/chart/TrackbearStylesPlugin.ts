import type { Chart } from 'chart.js';

export interface TrackbearStylesPluginOptions {
  enabled?: boolean;
  ignorePar?: boolean;
}

function makeTrackbearStylesPlugin(getColor) {
  const POINT_STYLES = ['circle', 'rect', 'crossRot', 'rectRot', 'triangle', 'star', 'rectRounded', 'cross'];
  const LINE_COLORS = [ getColor('primary'), getColor('danger'), getColor('info'), getColor('warning') ];

  const PAR_COLOR = getColor('success');
  const PAR_POINT_STYLE = 'cross';
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

      // set text color
      chart.config.options.color = getColor('secondary');

      // configure axes and grids
      Object.keys(chart.config.options.scales).forEach(scaleId => {
        chart.config.options.scales[scaleId].ticks.color = getColor('secondary');
      });

      chart.config.options.scales['x'].grid.color = getColor('backgroundBorder');
      chart.config.options.scales['y'].grid.color = ctx => ctx.tick.value === 0 ? getColor('secondary') : getColor('backgroundBorder');
      chart.config.options.scales['y'].grid.z = 0;

      // configure dataset colors and points
      chart.config.data.datasets.forEach((dataset, ix) => {
        if(!options.ignorePar && dataset.label === 'Par') {
          dataset.borderColor = PAR_COLOR;
          dataset.backgroundColor = PAR_COLOR;
          dataset.pointStyle = PAR_POINT_STYLE;
          dataset.borderDash = PAR_BORDER_DASH;
          dataset.borderWidth = 1;
        } else {
          dataset.borderColor = LINE_COLORS[ix % LINE_COLORS.length];
          dataset.backgroundColor = LINE_COLORS[ix % LINE_COLORS.length];
          dataset.pointStyle = POINT_STYLES[Math.floor(ix / LINE_COLORS.length)];
          dataset.pointRadius = 4;
          dataset.borderWidth = 2;
        }
      });

      // configure legend styles
      chart.config.options.plugins.legend.labels.usePointStyle = true;

      // configure tooltip styles
      chart.config.options.plugins.tooltip.boxPadding = 4;
      chart.config.options.plugins.tooltip.usePointStyle = true;
    }
  }
}

export default makeTrackbearStylesPlugin;
