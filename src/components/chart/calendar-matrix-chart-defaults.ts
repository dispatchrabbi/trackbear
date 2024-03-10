import { MatrixChartOptions, MatrixChartData } from './CalendarMatrixChart.vue';

import twColors from 'tailwindcss/colors';
import themeColors from 'src/themes/primevue.ts';
import Color from 'color';

import { deepMergeWithDefaults } from 'src/lib/obj.ts';
import { parseDateString, formatDate } from 'src/lib/date.ts';
import { startOfWeek } from 'date-fns';

declare module 'chart.js' {
  interface MatrixDataPoint {
    x: string;
    y: string;
    value: number;
  }
}

export const DEFAULT_MATRIX_COLORS = {
  text: themeColors.surface[700],
  secondaryText: themeColors.surface[400],

  primary: themeColors.primary[500],
  cycle: [twColors.red[500], twColors.orange[500], twColors.yellow[500], twColors.green[500], twColors.blue[500], twColors.purple[500] ],
};

export const DEFAULT_MATRIX_CHART_OPTIONS: MatrixChartOptions = {
  scales: {
    x: {
      type: 'time',
      position: 'bottom',
      offset: true,
      time: {
        unit: 'week',
        round: 'week',
        isoWeekday: 1,
        displayFormats: {
          week: 'MMM dd'
        },
      },
      ticks: {
        maxRotation: 0,
        autoSkip: false,
      },
      grid: {
        display: false,
        tickLength: 0,
      },
      border: {
        display: false,
      },
    },
    y: {
      type: 'time',
      position: 'left',
      reverse: true, // Sun-Sat going down, not up
      offset: true,
      time: {
        unit: 'day',
        round: 'day',
        isoWeekday: 1,
        parser: 'i',
        displayFormats: {
          day: 'iiiii'
        },
      },
      ticks: {
        maxRotation: 0,
        autoSkip: false, // docs have true but feels like we shouldn't skip any labels here?
        padding: 1,
        font: { size: 9 },
        crossAlign: 'center',
      },
      grid: {
        display: false,
        tickLength: 0,
      },
      border: {
        display: false,
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: true,
      displayColors: false,
      callbacks: {
        title: () => '',
        label: ctx => {
          const datum = ctx.dataset.data[ctx.dataIndex];
          return [ '' + datum.x, '' + datum.value ];
        },
      }
    },
  },
  animation: false,
  responsive: true,
  maintainAspectRatio: false,
};

export function provideMatrixChartOptionsDefaults(options: MatrixChartOptions): MatrixChartOptions {
  return deepMergeWithDefaults(DEFAULT_MATRIX_CHART_OPTIONS, options);
}

export function provideMatrixChartDataDefaults(data: MatrixChartData): MatrixChartData {
  // if there's only one dataset (which there probably is) use the primary theme color
  const colorCycle = data.datasets.length > 1 ? DEFAULT_MATRIX_COLORS.cycle : [ DEFAULT_MATRIX_COLORS.primary ];
  data.datasets.forEach((dataset, ix) => {
    const baseColor = colorCycle[ix % colorCycle.length];

    let maxValue = dataset.data.reduce((max, datapoint) => Math.max(max, datapoint.value), 0);
    if(maxValue === 0) { maxValue = 1; } // don't divide by zero later on

    dataset.backgroundColor = dataset.backgroundColor ?? function(ctx) {
      const value = ctx.dataset.data[ctx.dataIndex].value;
      return Color(baseColor).alpha(value / maxValue).rgb().string();
    };

    dataset.borderColor = dataset.borderColor ?? function(ctx) {
      const value = ctx.dataset.data[ctx.dataIndex].value;
      return Color(baseColor).alpha(Math.max(value / maxValue, 0.1)).darken(0.3).rgb().string();
    };

    dataset.borderWidth = dataset.borderWidth ?? 1;

    const numberOfWeeksInDataset = (new Set(dataset.data.map(datum => formatDate(startOfWeek(parseDateString(datum.x), { weekStartsOn: 1 }))))).size;
    dataset.width = dataset.width ?? function(ctx) {
      const area = ctx.chart.chartArea || { left: 0, right: 0};
      return ((area.right - area.left) / numberOfWeeksInDataset) - 1; // 53 columns: years usually start mid-week; 1 just for some space
    }

    dataset.height = dataset.height ?? function(ctx) {
      const area = ctx.chart.chartArea || { top: 0, bottom: 0 };
      return ((area.bottom - area.top) / 7) - 1; // 7 days in a week; ; 1 just for some space
    }
  });

  console.log({data});
  return data;
}
