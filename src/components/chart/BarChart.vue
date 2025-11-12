<script setup lang="ts">
import { ref, watchEffect, defineProps, withDefaults, onMounted, useTemplateRef, computed } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import * as Plot from '@observablehq/plot';
import { utcFormat } from 'd3-time-format';

import type { SeriesDataPoint, BareDataPoint, PlotDataPoint } from './types';
import { useChartColors } from './chart-colors';
import { determineChartDomain, formatCountForChart, getSeriesName, mapSeriesToColor, orderSeries, type SeriesInfoMap } from './chart-functions';

import { kify } from 'src/lib/number';
import { formatDate, formatDuration, parseDateString } from 'src/lib/date';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts';
import { LEADERBOARD_MEASURE, type LeaderboardMeasure } from 'server/lib/models/leaderboard/consts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally';
import { addHours, addMilliseconds } from 'date-fns';

const props = withDefaults(defineProps<{
  data: SeriesDataPoint[];
  par?: BareDataPoint[] | null;
  measureHint: LeaderboardMeasure;
  stacked?: boolean;
  valueFormatFn?: (value: number) => string;
  seriesInfo: SeriesInfoMap;
  showLegend?: boolean;
  forceSeriesNameInTooltip?: boolean;
  isFullscreen?: boolean;
}>(), ({
  par: null,
  stacked: false,
  valueFormatFn: undefined,
  showLegend: true,
  forceSeriesNameInTooltip: false,
  isFullscreen: false,
}));

function getSuggestedYAxisMaximum(measureHint: LeaderboardMeasure) {
  if(measureHint === LEADERBOARD_MEASURE.PERCENT) {
    return 100;
  } else {
    return TALLY_MEASURE_INFO[measureHint].defaultChartMaxEach;
  }
};

const seriesOrder = computed(() => {
  return orderSeries(props.data);
});

const chartColors = useChartColors();
const colorOrder = computed(() => {
  return mapSeriesToColor(props.seriesInfo, seriesOrder.value, chartColors.value);
});

const data = computed<PlotDataPoint[]>(() => {
  return props.data.map(d => ({
    series: d.series,
    date: parseDateString(d.date, true),
    value: d.value,
  }));
});

const par = computed<PlotDataPoint[]>(() => {
  return props.par?.map(d => ({
    series: 'Par',
    date: addMilliseconds(parseDateString(d.date, true), 1),
    value: d.value,
  })) ?? [];
});

const tooltipData = computed<PlotDataPoint[]>(() => {
  return ([] as PlotDataPoint[]).concat(
    data.value.filter(d => d.value !== 0),
    par.value,
  );
});

// now we can start configuring the chart
const plotContainer = useTemplateRef('plot-container');
const plotContainerWidth = ref(0);

function renderChart() {
  const chart = Plot.plot({
    // style and placement
    style: {
      fontFamily: 'Jost, sans-serif',
      fontSize: '0.75rem',
    },
    figure: true,
    // the plot should be a 16:9 aspect ratio
    width: plotContainerWidth.value,
    height: (plotContainerWidth.value * 9) / 16,
    marginLeft: props.measureHint === TALLY_MEASURE.TIME ? 60 : undefined,
    marginBottom: 36,

    // scales
    x: {
      type: 'utc',
      tickFormat: (d: Date) => (d.getUTCHours() === 0) ? utcFormat('%-d\n%b')(d) : '',
    },
    y: {
      domain: determineChartDomain(props.data, props.par, getSuggestedYAxisMaximum(props.measureHint), props.stacked),
      tickFormat:
        props.measureHint === TALLY_MEASURE.TIME ?
          tick => formatDuration(tick) :
          props.measureHint === 'percent' ?
            tick => `${tick}%` :
            tick => kify(tick),
      grid: true,
      nice: true,
      zero: true,
    },
    color: {
      type: 'categorical',
      domain: props.par ? ['Par', ...seriesOrder.value] : seriesOrder.value,
      range: props.par ? [chartColors.value.par, ...colorOrder.value] : colorOrder.value,
      legend: props.showLegend,
      tickFormat: d => getSeriesName(props.seriesInfo, d),
    },

    marks: [
      // zero axis
      Plot.ruleY([0]),
      // bars
      Plot.rectY(data.value, {
        x: 'date',
        // we have to move the x position back half a day so it's centered on the axis tick
        x1: d => addHours(d.date, -12),
        x2: d => addHours(d.date, 12),
        y: 'value',
        z: 'series',
        fill: 'series',
        order: seriesOrder.value,
        insetLeft: 1,
        insetRight: 1,
      }),
      // par line
      props.par === null ?
        null :
          Plot.lineY(par.value, {
            x: 'date',
            y: 'value',
            stroke: chartColors.value.par,
            strokeDasharray: 8,
          }),
      // tooltips
      Plot.tip(tooltipData.value, Plot.pointer(Plot.stackY2({
        x: 'date',
        y: 'value',
        z: 'series',
        channels: {
          date: { label: '', value: 'date' },
          series: { label: '', value: 'series', scale: 'color' },
          value: { label: '', value: 'value' },
        },
        format: {
          date: d => formatDate(d, true),
          series: (props.forceSeriesNameInTooltip || seriesOrder.value.length > 1) ? d => getSeriesName(props.seriesInfo, d) : false,
          value: props.valueFormatFn ?? (d => formatCountForChart(d, props.measureHint)),
          x: false,
          y: false,
          z: false,
        },
        fill: chartColors.value.background,
        order: seriesOrder.value,
      }))),
    ],
  });

  return chart;
}

onMounted(() => {
  useResizeObserver(plotContainer, entries => {
    plotContainerWidth.value = entries[0].contentRect.width;
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
    ref="plot-container"
    :class="[
      'bar-chart-container',
      isFullscreen ? 'fullscreen' : null,
    ]"
  />
</template>

<style scoped>
.bar-chart-container {
  position: relative;
  margin: auto;

  min-height: 12rem;
  max-height: calc(100vh - 4rem);
  max-width: 100%;
}

.bar-chart-container.fullscreen {
  height: calc(100vh - 4rem);
  width: calc(100vw - 4rem);
}
</style>
