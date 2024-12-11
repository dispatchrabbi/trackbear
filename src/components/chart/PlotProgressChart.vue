<script setup lang="ts">
import { ref, computed, watchEffect, defineProps, withDefaults, onMounted, useTemplateRef } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import * as Plot from "@observablehq/plot";
import { utcFormat } from 'd3-time-format'

import { saveSvgAsPng } from 'src/lib/image.ts';

import { useTheme } from 'src/lib/theme';
import twColors from 'tailwindcss/colors.js';
import themeColors from 'src/themes/primevue.ts';

import { kify } from 'src/lib/number';
import { formatDuration } from 'src/lib/date';
import { TallyMeasure, TALLY_MEASURE } from 'server/lib/models/tally';
import { TALLY_MEASURE_INFO, formatCount } from 'src/lib/tally';

export type LineChartDataPoint = {
  series: string;
  date: string;
  value: number;
};

export type LineChartConfig = {
  showLegend: boolean;
  measureHint: TallyMeasure | 'percent';
  seriesTitle: string;
};

const props = withDefaults(defineProps<{
  data: LineChartDataPoint[];
  par?: LineChartDataPoint[];
  valueFormatFn?: (value: number) => string;
  config?: Partial<LineChartConfig>;
  isStacked?: boolean;
  isFullscreen?: boolean;
}>(), {
  par: null,
  valueFormatFn: null,
  config: () => ({
    showLegend: true,
    measureHint: TALLY_MEASURE.WORD,
    seriesTitle: 'Participant',
  }),
  isStacked: false,
  isFullscreen: false,
});

const DEFAULT_LINE_COLORS = {
  text: { light: themeColors.surface[900], dark: themeColors.surface[50] },
  secondaryText: { light: themeColors.surface[300], dark: themeColors.surface[600] },
  background: { light: themeColors.surface[50], dark: themeColors.surface[800] },

  cycle: {
    light: [
      themeColors.primary[500], twColors.red[500], twColors.orange[500], twColors.yellow[500], twColors.green[500], twColors.blue[500], twColors.purple[500],
      themeColors.primary[300], twColors.red[300], twColors.orange[300], twColors.yellow[300], twColors.green[300], twColors.blue[300], twColors.purple[300],
      themeColors.primary[700], twColors.red[700], twColors.orange[700], twColors.yellow[700], twColors.green[700], twColors.blue[700], twColors.purple[700],
    ],
    dark: [
      themeColors.primary[400], twColors.red[400], twColors.orange[400], twColors.yellow[400], twColors.green[400], twColors.blue[400], twColors.purple[400],
      themeColors.primary[300], twColors.red[300], twColors.orange[300], twColors.yellow[300], twColors.green[300], twColors.blue[300], twColors.purple[300],
      themeColors.primary[700], twColors.red[700], twColors.orange[700], twColors.yellow[700], twColors.green[700], twColors.blue[700], twColors.purple[700],
    ],
  },
};
const colorScheme = computed(() => {
  const preferredColorScheme = useTheme().theme.value;
  return {
    text: DEFAULT_LINE_COLORS.text[preferredColorScheme],
    secondaryText: DEFAULT_LINE_COLORS.secondaryText[preferredColorScheme],
    background: DEFAULT_LINE_COLORS.background[preferredColorScheme],
    cycle: DEFAULT_LINE_COLORS.cycle[preferredColorScheme],
  };
});

// now start configuring the chart
const plotContainer = useTemplateRef('plot-contatiner');
const plotContainerWidth = ref(0);

const getSuggestedYAxisMaximum = function(measureHint: TallyMeasure | 'percent') {
  if(measureHint === 'percent') {
    return 100;
  } else {
    return TALLY_MEASURE_INFO[measureHint].defaultChartMax
  }
};

// so we have to do this this way because you can't initialize a prop with a default that refers to another prop
const formatValue = function(d: number) {
  if(props.valueFormatFn) {
    return props.valueFormatFn(d);
  } else {
    return formatCount(d, props.config.measureHint);
  }
}

const handlePlotDoubleclick = function(ev: MouseEvent) {
  // only do this if the alt/option key is held down
  if(!ev.altKey) { return; }

  const figureEl = plotContainer.value.querySelector('figure');
  const svgClass = figureEl.className.replace('-figure', '');
  const svgEl = plotContainer.value.querySelector(`svg.${svgClass}`) as SVGSVGElement;
  saveSvgAsPng(svgEl, 'chart.png', DEFAULT_LINE_COLORS.background.light);
}

onMounted(() => {
  useResizeObserver(plotContainer, entries => {
    plotContainerWidth.value = entries[0].contentRect.width;
  });

  watchEffect(() => {
    const marks = [
      Plot.ruleY([0]),
    ];

    if(props.isStacked) {
      marks.push(
        Plot.areaY(props.data, Plot.stackY({
          x: 'date',
          y: 'value',
          z: 'series',
          order: 'series',
          sort: 'date',
          fill: 'series',
        }))
      );
    } else {
      marks.push(
        Plot.lineY(props.data, {
          x: 'date',
          y: 'value',
          z: 'series',
          sort: 'date',
          stroke: 'series',
          marker: 'dot',
        })
      );
    }
    if(props.par !== null) {
      marks.unshift(
        Plot.lineY(props.par, {
          x: 'date',
          y: 'value',
          stroke: 'series',
          strokeDasharray: 8,
        })
      );
    }

    const tooltipData = props.data.concat(props.par ?? []);
    const seriesNames = tooltipData.reduce((set, d) => set.add(d.series), new Set());
    marks.push(
      Plot.tip(tooltipData, Plot.pointer({
        x: { label: 'Date', value: 'date' },
        y: { label: 'Value', value: 'value' },
        channels: {
          series: { label: 'Series', value: 'series' },
        },
        format: {
          series: seriesNames.size > 1,
          x: true,
          y: formatValue,
        },
        fill: colorScheme.value.background,
      }))
    );

    const chart = Plot.plot({
      style: {
        fontFamily: 'Jost, sans-serif',
        fontSize: '0.75rem',
      },
      figure: true,
      // the plot should be a 16:9 aspect ratio
      width: plotContainerWidth.value,
      height: (plotContainerWidth.value * 9) / 16,
      marginLeft: props.config.measureHint === TALLY_MEASURE.TIME ? 60 : undefined,
      marginBottom: 36,
      color: {
        type: 'categorical',
        range: colorScheme.value.cycle,
        legend: props.config.showLegend,
      },
      x: {
        type: 'utc',
        nice: 'day',
        tickFormat: (d: Date) => {
          if(d.getUTCHours() === 0) {
            return utcFormat("%-d\n%b")(d);
          } else {
            return '';
          }
        },
      },
      y: {
        tickFormat: props.config.measureHint === TALLY_MEASURE.TIME ?
          tick => formatDuration(tick) :
          props.config.measureHint === 'percent' ?
          tick => `${tick}%` :
          tick => kify(tick),
        grid: true,
        domain: [
          props.data.concat(props.par ?? []).reduce((min, point) => Math.min(min, point.value), 0),
          props.data.concat(props.par ?? []).reduce((max, point) => Math.max(max, point.value), getSuggestedYAxisMaximum(props.config.measureHint)),
        ]
      },
      marks: marks,
    });

    plotContainer.value.replaceChildren(chart);
  });
});
</script>

<template>
  <div
    ref="plot-contatiner"
    :class="[
      'line-chart-container',
      isFullscreen ? 'line-chart-container-fullscreen' : null,
    ]"
    @dblclick="handlePlotDoubleclick"
  />
</template>

<style scoped>
.line-chart-container {
  position: relative;
  margin: auto;

  min-height: 12rem;
  max-height: calc(100vh - 4rem);
  max-width: 100%;
}

.line-chart-container-fullscreen {
  height: calc(100vh - 4rem);
  width: calc(100vw - 4rem);
}
</style>
