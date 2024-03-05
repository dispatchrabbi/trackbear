import type { Chart } from 'chart.js';

export interface TrackbearLineStylesPluginOptions {
  enabled?: boolean;
}

export type TrackbearLineStylesPluginColors = {
  text: string;
  secondaryText: string;
  red: string;
  orange: string;
  yellow: string;
  green: string;
  blue: string;
  purple: string;
  cycle?: string[];
}

function makeTrackbearLegacyStylesPlugin(colors: TrackbearLineStylesPluginColors) {
  if(!colors.cycle) {
    colors.cycle = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  }

  const POINT_STYLES = ['circle', 'rect', 'crossRot', 'rectRot', 'triangle', 'star', 'rectRounded', 'cross'];
  const LINE_COLORS = colors.cycle.map(color => colors[color]);

  // This is with heavy copying from https://github.com/chartjs/Chart.js/blob/master/src/plugins/plugin.colors.ts
  return {
    id: 'trackbear-line-styles',
    defaults: {
      enabled: true,
    } as TrackbearLineStylesPluginOptions,

    beforeLayout(chart: Chart<'line'>, _args, options: TrackbearLineStylesPluginOptions) {
      if(!options.enabled) {
        return;
      }

      // set text color
      chart.config.options.color = colors.text;

      // configure axes and grids
      Object.keys(chart.config.options.scales).forEach(scaleId => {
        chart.config.options.scales[scaleId].ticks.color = colors.text;
      });

      // TODO: make border colors nicer
      chart.config.options.scales['x'].grid.color = colors.text;
      chart.config.options.scales['y'].grid.color = ctx => ctx.tick.value === 0 ? colors.text : colors.secondaryText;
      chart.config.options.scales['y'].grid.z = 0;

      // configure dataset colors and points
      chart.config.data.datasets.forEach((dataset, ix) => {
        dataset.borderColor = LINE_COLORS[ix % LINE_COLORS.length];
        dataset.backgroundColor = LINE_COLORS[ix % LINE_COLORS.length];
        dataset.pointStyle = POINT_STYLES[Math.floor(ix / LINE_COLORS.length)];
        dataset.pointRadius = 4;
        dataset.borderWidth = 2;

      });

      // configure legend styles
      chart.config.options.plugins.legend.labels = {
        ...(chart.config.options.plugins.legend.labels || {}),
        usePointStyle: true,
      };

      // configure tooltip styles
      chart.config.options.plugins.tooltip = {
        ...(chart.config.options.plugins.tooltip || {}),
        boxPadding: 4,
        usePointStyle: true
      };
    }
  }
}

export default makeTrackbearLegacyStylesPlugin;
