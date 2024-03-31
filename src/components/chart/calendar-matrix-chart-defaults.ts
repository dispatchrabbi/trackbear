import { MatrixChartOptions, MatrixChartData } from './CalendarMatrixChart.vue';

import twColors from 'tailwindcss/colors.js';
import themeColors from 'src/themes/primevue.ts';
import Color from 'color';
import { usePreferredColorScheme } from '@vueuse/core';

import { deepMergeWithDefaults } from 'src/lib/obj.ts';
import { formatDate, parseDateString } from 'src/lib/date.ts';
import { differenceInCalendarWeeks } from 'date-fns';

declare module 'chart.js' {
  interface MatrixDataPoint {
    x: string;
    y: string;
    value: number;
  }
}

export const MATRIX_COLORS = {
  light: {
    text: themeColors.surface[900],
    background: themeColors.surface[100],
    zero: themeColors.primary[100],
    primary: themeColors.primary[500],
    zeroStripe: twColors.sky[100],
    primaryStripe: twColors.sky[500],
    today: twColors.amber[500],
  },
  dark: {
    text: themeColors.surface[50],
    background: themeColors.surface[900],
    zero: themeColors.primary[950],
    primary: themeColors.primary[400],
    zeroStripe: twColors.sky[950],
    primaryStripe: twColors.sky[400],
    today: twColors.amber[300],
  },
};

export const DEFAULT_MATRIX_CHART_OPTIONS: MatrixChartOptions = {
  scales: {
    x: {
      type: 'time',
      position: 'bottom',
      offset: true,
      time: {
        unit: 'month',
        round: 'week',
        isoWeekday: 1,
        displayFormats: {
          week: 'MMM'
        },
      },
      ticks: {
        maxRotation: 0,
        autoSkip: false,
        align: 'start',
        labelOffset: -6,
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
        title: ctx => {
          // TODO: this may need to change if there are multiple datasets
          const datum = ctx[0].dataset.data[ctx[0].dataIndex];
          return datum.x;
        },
        label: ctx => {
          const datum = ctx.dataset.data[ctx.dataIndex];
          return '' + datum.value;
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

export type ProvideMatrixChartDataDefaultsOptions = {
  highlightToday?: boolean;
};
export function provideMatrixChartDataDefaults(data: MatrixChartData, options: ProvideMatrixChartDataDefaultsOptions): MatrixChartData {
  options = {
    highlightToday: options.highlightToday || false,
  };

  const todayDate = formatDate(new Date());

  // TODO: this doesn't quite work for multiple datasets
  data.datasets.forEach((dataset) => {
    const colorScheme = usePreferredColorScheme().value;
    const primaryColor = MATRIX_COLORS[colorScheme].primary;
    const zeroColor = MATRIX_COLORS[colorScheme].zero;
    const primaryStripeColor = MATRIX_COLORS[colorScheme].primaryStripe;
    const zeroStripeColor = MATRIX_COLORS[colorScheme].zeroStripe;
    const todayColor = MATRIX_COLORS[colorScheme].today;
    const backgroundColor = MATRIX_COLORS[colorScheme].background;

    let maxValue = dataset.data.reduce((max, datapoint) => Math.max(max, datapoint.value), 0);
    if(maxValue === 0) { maxValue = 1; } // don't divide by zero later on

    // there are a few different scenarios we have to deal with here:
    // - data = null (usually for future dates): normal background, no border
    // - data = 0: secondary background, secondary border
    // - data > 0: primary background, primary border
    // - today: normal or primary background, accent border

    dataset.backgroundColor = dataset.backgroundColor ?? function(ctx) {
      const date = ctx.dataset.data[ctx.dataIndex].x;
      const value = ctx.dataset.data[ctx.dataIndex].value;

      let color = null;
      if(value === null) {
        color = Color(backgroundColor).alpha(0.3).rgb().string();
      } else if(value === 0) {
        color = Color(getMonth(date) % 2 ? zeroStripeColor : zeroColor).alpha(1).rgb().string();
      } else {
        color = Color(getMonth(date) % 2 ? primaryStripeColor : primaryColor).alpha(value / maxValue).rgb().string();
      }

      return color;
    };

    dataset.borderColor = dataset.borderColor ?? function(ctx) {
      const date = ctx.dataset.data[ctx.dataIndex].x;
      const value = ctx.dataset.data[ctx.dataIndex].value;

      let color = null;
      if(options.highlightToday && date == todayDate) {
        color = Color(todayColor).alpha(1).rgb().string();
      } else if(value === null) {
        color = Color(backgroundColor).alpha(0).rgb().string();
      } else if(value === 0) {
        color = Color(getMonth(date) % 2 ? zeroStripeColor : zeroColor).alpha(1).rgb().string();
      } else {
        color = Color(getMonth(date) % 2 ? primaryStripeColor : primaryColor).alpha(value / maxValue).rgb().string();
      }

      return color;
    };

    dataset.borderWidth = dataset.borderWidth ?? 1;


    // make sure we render in good-size squares
    dataset.width = dataset.width ?? 16;
    dataset.height = dataset.height ?? 16;
  });

  return data;
}

export function calculateChartWidth(chartData: MatrixChartData, sideLength = 16, spacing = 2) {
  const allDatesSorted = Array.from(new Set(chartData.datasets.flatMap(dataset => dataset.data.map(datum => datum.x)))).sort();

  const startDate = parseDateString(allDatesSorted[0]);
  const endDate = parseDateString(allDatesSorted[allDatesSorted.length - 1]);
  const weekSpan = differenceInCalendarWeeks(endDate, startDate, { weekStartsOn: 1 });

  const chartWidth =
    (sideLength * weekSpan) + // height of the squares
    (spacing * (weekSpan - 1)) + // height of the spacing
    78 // account for the axis + padding
  ;
  return chartWidth;
}

export function calculateChartHeight(numberOfDays = 7, sideLength = 16, spacing = 2) {
  const chartHeight =
    (sideLength * numberOfDays) + // width of the squares
    (spacing * (numberOfDays - 1)) + // width of the spacing
    20 // account for the axis + padding
  ;
  return chartHeight;
}

function getMonth(dateString: string) {
  return +dateString.substring(5, 7);
}
