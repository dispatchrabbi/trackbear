<script setup lang="ts">
import { ref, computed, watchEffect, defineProps, withDefaults, onMounted } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import * as Plot from "@observablehq/plot";

import { usePreferredColorScheme } from '@vueuse/core';
import twColors from 'tailwindcss/colors.js';
import themeColors from 'src/themes/primevue.ts';
import { kify } from 'src/lib/number';

export type LineChartDataPoint = {
  series: string;
  date: string;
  value: number;
};

const props = withDefaults(defineProps<{
  data: LineChartDataPoint[];
  par?: LineChartDataPoint[];
  valueFormatFn?: (value: number) => string;
  // config?: Partial<LineChartConfig>;
  isStacked?: boolean;
  isFullscreen?: boolean;
}>(), {
  par: null,
  valueFormatFn: value => value.toString(),
  // config: () => ({}),
  isStacked: false,
  isFullscreen: false,
});

const DEFAULT_LINE_COLORS = {
  text: { light: themeColors.surface[900], dark: themeColors.surface[50] },
  secondaryText: { light: themeColors.surface[300], dark: themeColors.surface[600] },

  cycle: {
    light: [ themeColors.primary[500], twColors.red[500], twColors.orange[500], twColors.yellow[500], twColors.green[500], twColors.blue[500], twColors.purple[500] ],
    dark: [ themeColors.primary[400], twColors.red[400], twColors.orange[400], twColors.yellow[400], twColors.green[400], twColors.blue[400], twColors.purple[400] ],
  },
};
const colorCycle = computed(() => {
  const preferredColorScheme = usePreferredColorScheme().value;
  return DEFAULT_LINE_COLORS.cycle[preferredColorScheme];
});

// now start configuring the chart
const plotContainer = ref(null);
const plotContainerWidth = ref(0);
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
          x: { label: 'Date', transform: data => data.map(d => d.date) },
          y: { label: 'Progress', transform: data => data.map(d => d.value) },
          order: 'appearance',
          sort: 'date',
          fill: { label: 'Participant', transform: data => data.map(d => d.series) },
          tip: {
            format: {
              x: true,
              fill: true,
              y: d => props.valueFormatFn(d),
            },
            pointer: 'xy',
          },
        }))
      );
    } else {
      marks.push(
        Plot.lineY(props.data, {
          x: { label: 'Date', transform: data => data.map(d => d.date) },
          y: { label: 'Progress', transform: data => data.map(d => d.value) },
          sort: 'date',
          stroke: { label: 'Participant', transform: data => data.map(d => d.series) },
          marker: 'dot',
          tip: {
            format: {
              x: true,
              fill: true,
              y: d => props.valueFormatFn(d),
            },
            pointer: 'xy',
          },
        })
      );
    }
    if(props.par !== null) {
      marks.push(
        Plot.lineY(props.par, {
          x: { label: 'Date', transform: data => data.map(d => d.date) },
          y: { label: 'Par', transform: data => data.map(d => d.value) },
          stroke: { label: 'Series', transform: data => data.map(d => d.series) },
          strokeDasharray: 8,
          tip: {
            format: {
              x: true,
              y: d => props.valueFormatFn(d),
              stroke: false,
              z: false,
            },
            pointer: 'xy',
          },
        })
      );
    }

    const chart = Plot.plot({
      style: {
        fontFamily: 'Jost, sans-serif',
        fontSize: '0.75rem',
      },
      width: plotContainerWidth.value,
      color: {
        type: 'categorical',
        range: colorCycle.value,
        legend: true,
      },
      x: { type: 'time' },
      y: {
        tickFormat: tick => kify(tick),
        grid: true,
      },
      marks: marks,
    });

    plotContainer.value.replaceChildren(chart);
  });
});
</script>

<template>
  <div
    ref="plotContainer"
    :class="[
      'line-chart-container',
      isFullscreen ? 'line-chart-container-fullscreen' : null,
    ]"
  />
</template>

<style scoped>
.line-chart-container {
  position: relative;
  margin: auto;

  /* this is all to keep the chart nicely-sized for desktop and mobile
     fullscreen is another ball of wax */
  aspect-ratio: calc(16 / 9);
  min-height: 12rem;
  max-height: calc(100vh - 4rem);
  max-width: 100%;
}

.line-chart-container-fullscreen {
  height: calc(100vh - 4rem);
  width: calc(100vw - 4rem);
}
</style>