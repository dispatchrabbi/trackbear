<script setup lang="ts">
import { ref, computed, watchEffect, withDefaults, onMounted, useTemplateRef } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import * as Plot from '@observablehq/plot';
import * as d3 from 'd3';
import { addWeeks, type Day, endOfWeek, startOfWeek, subWeeks } from 'date-fns';

import { useChartColors } from './chart-colors';
const chartColors = useChartColors();

import { saveSvgAsPng } from 'src/lib/image.ts';

export type CalendarHeatMapDataPoint<T = unknown> = {
  date: Date;
  value: T;
};

export type NormalizerFn = (datum: CalendarHeatMapDataPoint, data: CalendarHeatMapDataPoint[]) => number | null;
export type ValueFormatFn = (datum: CalendarHeatMapDataPoint) => string;

const props = withDefaults(defineProps<{
  data: CalendarHeatMapDataPoint[];
  anchor?: 'start' | 'end';
  constrainWidth?: boolean;
  normalizerFn?: NormalizerFn;
  valueFormatFn?: ValueFormatFn;
  weekStartsOn?: number;
}>(), {
  anchor: 'start',
  constrainWidth: false,
  normalizerFn: datum => datum.value == null ? null : (+datum.value) !== 0 ? 1 : 0,
  valueFormatFn: datum => datum.value.toString(),
  weekStartsOn: 0, // Sunday
});

const weekStartsOn = computed<Day>(() => {
  return ([0, 1, 2, 3, 4, 5, 6].includes(props.weekStartsOn) ? props.weekStartsOn : 0) as Day;
});

const d3TimeDays = [
  d3.timeSunday,
  d3.timeMonday,
  d3.timeTuesday,
  d3.timeWednesday,
  d3.timeThursday,
  d3.timeFriday,
  d3.timeSaturday,
];
function getWeekNumber(targetDate, startDate) {
  const d3Interval = d3TimeDays[weekStartsOn.value];
  return d3Interval.count(d3Interval(startDate), d3.timeDay(targetDate));
}

const colorScale = computed(() => {
  // TODO: make better chart colors for this
  const start = chartColors.value.background;
  const end = chartColors.value.par;

  const scale = d3.interpolateLab(start, end);
  return scale;
});

const WEEKDAY_AXIS_WIDTH = 18;
const MONTH_AXIS_HEIGHT = 16;
const SQUARE_SIDE_LENGTH = 17; // accounts for 16px side length and an inset of 0.5 on all sides

const chartContainerWidth = ref(0);
const maximumWeeksVisible = computed(() => {
  const spaceForData = chartContainerWidth.value - WEEKDAY_AXIS_WIDTH;
  if(spaceForData < SQUARE_SIDE_LENGTH) {
    return 0;
  } else {
    return Math.floor(spaceForData / SQUARE_SIDE_LENGTH);
  }
});

const sortedData = computed(() => {
  return props.data.toSorted((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
});

const visibleData = computed(() => {
  if(!props.constrainWidth) {
    return sortedData.value;
  } else if(maximumWeeksVisible.value === 0 || sortedData.value.length === 0) {
    return [];
  }

  const bounds = {
    startDate: sortedData.value.at(0)!.date,
    endDate: sortedData.value.at(-1)!.date,
  };
  if(props.anchor === 'start') {
    // modify end date
    bounds.endDate = endOfWeek(
      addWeeks(
        startOfWeek(bounds.startDate, { weekStartsOn: weekStartsOn.value }),
        maximumWeeksVisible.value - 1, // minus 1 because we already have startDate's week
      ),
      { weekStartsOn: weekStartsOn.value },
    );
  } else if(props.anchor === 'end') {
    // modify start date
    bounds.startDate = startOfWeek(
      subWeeks(
        endOfWeek(bounds.endDate, { weekStartsOn: weekStartsOn.value }),
        maximumWeeksVisible.value - 1, // minus 1 because we already have endDate's week
      ),
      { weekStartsOn: weekStartsOn.value },
    );
  }

  return sortedData.value.filter(datum => datum.date >= bounds.startDate && datum.date <= bounds.endDate);
});

const dateBounds = computed(() => {
  if(visibleData.value.length === 0) {
    return {
      startDate: new Date(),
      endDate: new Date(),
      weeks: 0,
    };
  }

  const startDate = visibleData.value.at(0)!.date;
  const endDate = visibleData.value.at(-1)!.date;
  return {
    startDate,
    endDate,
    // count is exclusive to the start date, so add 1 to count the first week
    weeks: getWeekNumber(endDate, startDate) + 1,
    // weeks: d3.timeSunday.count(d3.timeSunday(startDate), d3.timeDay(endDate)) + 1,
  };
});

const formatDateForTooltip = d3.timeFormat('%x');
function formatTooltip(d) {
  const formattedValue = props.valueFormatFn(d);

  return formatDateForTooltip(d.date) + '\n\n' + (formattedValue.length > 0 ? formattedValue : 'No activity');
}

// now we can start configuring the chart
const chartContainer = useTemplateRef('chart-container');
const plotContainer = useTemplateRef('plot-container');
const plotDimensions = computed(() => {
  const widthTheChartWantsToBe = (
    SQUARE_SIDE_LENGTH * dateBounds.value.weeks + // n columns
    WEEKDAY_AXIS_WIDTH // width of the axis on left
  );

  const constrainedMaximumChartWidth = (maximumWeeksVisible.value * SQUARE_SIDE_LENGTH) + WEEKDAY_AXIS_WIDTH;

  const heightOfTheChartAlways = (
    SQUARE_SIDE_LENGTH * 7 + // 7 rows per week
    MONTH_AXIS_HEIGHT // height of the axis on top
  );

  return {
    width: props.constrainWidth ? Math.min(constrainedMaximumChartWidth, widthTheChartWantsToBe) : widthTheChartWantsToBe,
    height: heightOfTheChartAlways,
  };
});

function handlePlotDoubleclick(ev: MouseEvent) {
  // only do this if the alt/option key is held down
  if(!ev.altKey) { return; }

  if(!chartContainer.value) { return; }

  const svgEl = chartContainer.value.querySelector(`svg`) as SVGSVGElement;
  saveSvgAsPng(svgEl, 'chart.png');
}

function renderChart() {
  const chart = Plot.plot({
    width: plotDimensions.value.width,
    height: plotDimensions.value.height,
    marginTop: MONTH_AXIS_HEIGHT,
    marginBottom: 0,
    marginLeft: WEEKDAY_AXIS_WIDTH,
    marginRight: 0,
    padding: 0,
    // These styles (position, z-index, overflow) allow the tooltip to extend outside the SVG
    // c.f. https://github.com/observablehq/plot/issues/1719#issuecomment-1605089811
    style: {
      position: 'relative',
      zIndex: '2',
      overflow: 'visible',
    },
    x: {
      axis: 'top',
      tickFormat: d => {
        const endOfThisWeek = addWeeks(endOfWeek(dateBounds.value.startDate, { weekStartsOn: weekStartsOn.value }), d);
        // did this week contain the first of the month? (or, is this the first column?)
        if(d === 0 || endOfThisWeek.getDate() <= 7) {
          return Plot.formatMonth('en', 'short')(endOfThisWeek.getMonth());
        } else {
          return null;
        }
      },
      tickSize: 0,
      tickPadding: 2,
    },
    y: {
      tickFormat: Plot.formatWeekday('en', 'narrow'),
      tickSize: 0,
      domain: [0, 1, 2, 3, 4, 5, 6].map(x => (x + weekStartsOn.value) % 7),
    },
    color: { interpolate: colorScale.value },
    marks: [
      Plot.cell(visibleData.value, {
        x: d => getWeekNumber(d.date, dateBounds.value.startDate),
        // x: d => d3.timeSunday.count(d3.timeDay(dateBounds.value.startDate), d3.timeDay(d.date)),
        y: d => (new Date(d.date)).getDay(),
        // fill: d => (console.log(d, visibleData.value, props.normalizerFn(d, visibleData.value)), props.normalizerFn(d, visibleData.value)),
        fill: d => props.normalizerFn(d, visibleData.value),
        inset: 0.5,
        margin: 0,
      }),
      Plot.tip(visibleData.value, Plot.pointer({
        x: d => getWeekNumber(d.date, dateBounds.value.startDate),
        // x: d => d3.timeSunday.count(d3.timeDay(dateBounds.value.startDate), d3.timeDay(d.date)),
        y: d => (new Date(d.date)).getDay(),
        // filter: d => Object.values(d.value).some(val => (val as number) !== 0),
        title: formatTooltip,
        fill: chartColors.value.background,
      })),
    ],
  });

  return chart;
}

onMounted(() => {
  useResizeObserver(chartContainer, entries => {
    // use this to figure out how much data we can show
    chartContainerWidth.value = entries[0].contentRect.width;
  });

  watchEffect(() => {
    if(!plotContainer.value) { return; }

    const chart = renderChart();
    plotContainer.value.replaceChildren(chart);
  });
});
</script>

<template>
  <div
    ref="chart-container"
    :class="{
      'chart-container': true,
      'overflow-x-auto': !props.constrainWidth,
    }"
  >
    <div
      ref="plot-container"
      :class="{
        'plot-container': true,
      }"
      :style="{
        width: plotDimensions.width + 'px',
        height: plotDimensions.height + 'px',
      }"
      @dblclick="handlePlotDoubleclick"
    />
  </div>
</template>
