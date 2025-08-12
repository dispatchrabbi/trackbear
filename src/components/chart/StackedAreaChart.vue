<script setup lang="ts">
import { ref, watchEffect, defineProps, withDefaults, onMounted, useTemplateRef } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import * as Plot from '@observablehq/plot';
import { utcFormat } from 'd3-time-format';

import { saveSvgAsPng } from 'src/lib/image.ts';

import { useChartColors } from './chart-colors';
import { getChartDomain, orderSeries } from './chart-functions';

import { kify } from 'src/lib/number';
import { formatDate, formatDuration, parseDateString } from 'src/lib/date';
import { TallyMeasure, TALLY_MEASURE } from 'server/lib/models/tally/consts';
import { TALLY_MEASURE_INFO, formatCount } from 'src/lib/tally';
import { addMilliseconds } from 'date-fns';

export type StackedAreaChartDataPoint = {
  series: string;
  date: string;
  value: number;
};

export type StackedAreaChartParDataPoint = {
  date: string;
  value: number;
};

const props = withDefaults(defineProps<{
  data: StackedAreaChartDataPoint[];
  par?: StackedAreaChartParDataPoint[];
  measureHint: TallyMeasure;
  valueFormatFn?: (value: number) => string;
  showLegend?: boolean;
  isFullscreen?: boolean;
}>(), ({
  par: null,
  showLegend: true,
  isFullscreen: false,
  valueFormatFn: null,
}));

function formatCountWithMeasureHint(value) {
  return formatCount(value, props.measureHint);
}

const chartColors = useChartColors();

// now we can start configuring the chart
const plotContainer = useTemplateRef('plot-container');
const plotContainerWidth = ref(0);

function handlePlotDoubleclick(ev: MouseEvent) {
  // only do this if the alt/option key is held down
  if(!ev.altKey) { return; }

  const figureEl = plotContainer.value.querySelector('figure');
  const svgClass = figureEl.className.replace('-figure', '');
  const svgEl = plotContainer.value.querySelector(`svg.${svgClass}`) as SVGSVGElement;
  saveSvgAsPng(svgEl, 'chart.png', chartColors.value.background);
}

function getSuggestedYAxisMaximum(measureHint: TallyMeasure, numberOfSeries: number) {
  return TALLY_MEASURE_INFO[measureHint].defaultChartMaxTotal * numberOfSeries;
};

type ChartDataPoint = {
  series: string;
  date: Date;
  value: number;
};

function renderChart() {
  // determine the order of the series
  const seriesOrder = orderSeries(props.data, true);

  // we will need to add anything that needs a tooltip to this
  const tooltipData: ChartDataPoint[] = [];

  const marks = [];

  // we need a zero axis
  marks.push(Plot.ruleY([0]));

  // now we add the data points
  const data = props.data.map(datapoint => ({
    series: datapoint.series,
    date: parseDateString(datapoint.date),
    value: datapoint.value,
  }));

  const dataStackMark = Plot.areaY(data, {
    x: 'date',
    y: 'value',
    z: 'series',
    order: seriesOrder,
    fill: 'series',
  });

  marks.push(dataStackMark);
  tooltipData.push(...data);

  // if there's par, let's add par
  if(props.par !== null) {
    const par = props.par.map(datapoint => ({
      series: 'Par',
      // we need to add 1 millisecond so that these are different from the dates in the main data stack
      date: addMilliseconds(parseDateString(datapoint.date), 1),
      value: datapoint.value,
    }));

    const parLineMark = Plot.lineY(par, {
      x: 'date',
      y: 'value',
      stroke: chartColors.value.par,
      strokeDasharray: 8,
    });

    marks.push(parLineMark);
    tooltipData.push(...par);
  }

  // lastly, add the tooltip
  const seriesNames = tooltipData.reduce((set, d) => set.add(d.series), new Set());
  const tooltipPointerMark = Plot.tip(tooltipData, Plot.pointer(Plot.stackY2({
    x: 'date',
    y: 'value',
    z: 'series',
    order: ['Par', ...seriesOrder],
    channels: {
      date: { label: '', value: 'date' },
      series: { label: '', value: 'series', scale: 'color' },
      value: { label: '', value: 'value' },
    },
    format: {
      date: formatDate,
      series: seriesNames.size > 1,
      value: props.valueFormatFn ?? formatCountWithMeasureHint,
      x: false,
      y: false,
    },
    fill: chartColors.value.background,
  })));

  marks.push(tooltipPointerMark);

  const chart = Plot.plot({
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
    color: {
      type: 'categorical',
      domain: ['Par', ...seriesOrder],
      range: [chartColors.value.par, ...chartColors.value.data],
      legend: props.showLegend,
    },
    x: {
      type: 'utc',
      nice: 'day',
      tickFormat: (d: Date) => {
        if(d.getUTCHours() === 0) {
          return utcFormat('%-d\n%b')(d);
        } else {
          return '';
        }
      },
    },
    y: {
      tickFormat: props.measureHint === TALLY_MEASURE.TIME ?
        tick => formatDuration(tick) :
        tick => kify(tick),
      grid: true,
      domain: getChartDomain(props.data, props.par, getSuggestedYAxisMaximum(props.measureHint, seriesOrder.length), true),
    },
    marks: marks,
  });

  return chart;
}

onMounted(() => {
  useResizeObserver(plotContainer, entries => {
    plotContainerWidth.value = entries[0].contentRect.width;
  });

  watchEffect(() => {
    const chart = renderChart();
    plotContainer.value.replaceChildren(chart);
  });
});

</script>

<template>
  <div
    ref="plot-container"
    :class="[
      'chart-container',
      isFullscreen ? 'fullscreen' : null,
    ]"
    @dblclick="handlePlotDoubleclick"
  />
</template>

<style scoped>
.chart-container {
  position: relative;
  margin: auto;

  min-height: 12rem;
  max-height: calc(100vh - 4rem);
  max-width: 100%;
}

.chart-container.fullscreen {
  height: calc(100vh - 4rem);
  width: calc(100vw - 4rem);
}
</style>
