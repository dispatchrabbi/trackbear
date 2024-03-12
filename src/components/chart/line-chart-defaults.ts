import { LineChartOptions, LineChartData } from './LineChart.vue';

import twColors from 'tailwindcss/colors.js';
import themeColors from 'src/themes/primevue.ts';

import { deepMergeWithDefaults } from 'src/lib/obj.ts';

export const LINE_COLORS = {
  text: themeColors.surface[700],
  secondaryText: themeColors.surface[400],

  cycle: [ themeColors.primary[500], twColors.red[500], twColors.orange[500], twColors.yellow[500], twColors.green[500], twColors.blue[500], twColors.purple[500] ],
};

export const LINE_POINT_STYLES = ['circle', 'rect', 'crossRot', 'rectRot', 'triangle', 'star', 'rectRounded', 'cross'];

export const DEFAULT_LINE_CHART_OPTIONS: LineChartOptions = {
  color: LINE_COLORS.text,
  scales: {
    x: {
      ticks: { color: LINE_COLORS.text },
      grid: { color: LINE_COLORS.text },
    },
    y: {
      ticks: { color: LINE_COLORS.text },
      grid: {
        color: ctx => ctx.tick.value === 0 ? LINE_COLORS.text : LINE_COLORS.secondaryText,
        z: 0,
      },
    }
  },
  plugins: {
    legend: {
      labels: {
        usePointStyle: true,
      },
    },
    tooltip: {
      usePointStyle: true,
      boxPadding: 4,
    },
  },
  animation: false,
  responsive: true,
  maintainAspectRatio: false,
};

export function provideLineChartOptionsDefaults(options: LineChartOptions): LineChartOptions {
  return deepMergeWithDefaults(DEFAULT_LINE_CHART_OPTIONS, options);
}

export function provideLineChartDataDefaults(data: LineChartData): LineChartData {
  data.datasets.forEach((dataset, ix) => {
    dataset.borderColor = LINE_COLORS.cycle[ix % LINE_COLORS.cycle.length];
    dataset.backgroundColor = LINE_COLORS.cycle[ix % LINE_COLORS.cycle.length];
    dataset.pointStyle = LINE_POINT_STYLES[Math.floor(ix / LINE_COLORS.cycle.length)];
    dataset.pointRadius = 4;
    dataset.borderWidth = 2;
  });

  return data;
}
