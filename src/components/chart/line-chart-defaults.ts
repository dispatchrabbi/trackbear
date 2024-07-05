import color from 'color';
import { FillTarget } from 'chart.js';
import { LineChartOptions, LineChartData } from './LineChart.vue';

import twColors from 'tailwindcss/colors.js';
import themeColors from 'src/themes/primevue.ts';
import { usePreferredColorScheme } from '@vueuse/core';

import { deepMergeWithDefaults } from 'src/lib/obj.ts';

export const DEFAULT_LINE_COLORS = {
  text: { light: themeColors.surface[900], dark: themeColors.surface[50] },
  secondaryText: { light: themeColors.surface[300], dark: themeColors.surface[600] },

  cycle: {
    light: [ themeColors.primary[500], twColors.red[500], twColors.orange[500], twColors.yellow[500], twColors.green[500], twColors.blue[500], twColors.purple[500] ],
    dark: [ themeColors.primary[400], twColors.red[400], twColors.orange[400], twColors.yellow[400], twColors.green[400], twColors.blue[400], twColors.purple[400] ],
  },
};

export const LINE_POINT_STYLES = ['circle', 'rect', 'crossRot', 'rectRot', 'triangle', 'star', 'rectRounded', 'cross'];

export function provideLineChartOptionsDefaults(options: LineChartOptions): LineChartOptions {
  const colorScheme = usePreferredColorScheme().value;

  const DEFAULT_LINE_CHART_OPTIONS: LineChartOptions = {
    color: DEFAULT_LINE_COLORS.text[colorScheme],
    scales: {
      x: {
        ticks: { color: DEFAULT_LINE_COLORS.text[colorScheme] },
        grid: { color: DEFAULT_LINE_COLORS.secondaryText[colorScheme] },
      },
      y: {
        ticks: { color: DEFAULT_LINE_COLORS.text[colorScheme] },
        grid: {
          color: ctx => ctx.tick.value === 0 ? DEFAULT_LINE_COLORS.text[colorScheme] : DEFAULT_LINE_COLORS.secondaryText[colorScheme],
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

  return deepMergeWithDefaults(DEFAULT_LINE_CHART_OPTIONS, options);
}

export function provideLineChartDataDefaults(data: LineChartData): LineChartData {
  const colorScheme = usePreferredColorScheme().value;

  data.datasets.forEach((dataset, ix) => {
    dataset.borderColor = dataset.borderColor ?? DEFAULT_LINE_COLORS.cycle[colorScheme][ix % DEFAULT_LINE_COLORS.cycle[colorScheme].length];
    dataset.backgroundColor = dataset.backgroundColor ?? DEFAULT_LINE_COLORS.cycle[colorScheme][ix % DEFAULT_LINE_COLORS.cycle[colorScheme].length];
    dataset.pointStyle = dataset.pointStyle ?? LINE_POINT_STYLES[Math.floor(ix / DEFAULT_LINE_COLORS.cycle[colorScheme].length)];
    dataset.pointRadius = dataset.pointRadius ?? 4;
    dataset.borderWidth = dataset.borderWidth ?? 2;

    if(dataset.fill === 'stack') {
      dataset.fill = {
        target: dataset.fill as FillTarget,
        below: color(dataset.backgroundColor).fade(0.5).toString(),
      };
    }
  });

  return data;
}
