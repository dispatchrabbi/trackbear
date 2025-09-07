<script setup lang="ts">
import { ref, computed, watchEffect, defineProps, withDefaults, onMounted, useTemplateRef } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import * as Plot from '@observablehq/plot';

import { useTheme } from 'src/lib/theme';
import twColors from 'tailwindcss/colors.js';
import themeColors from 'src/themes/primevue.ts';
import { kify } from 'src/lib/number';

export type BarChartDataPoint = {
  series: string;
  date: string;
  value: number;
};

export type BarChartConfig = {
  interval: 'day' | 'week' | 'month';
};

const props = withDefaults(defineProps<{
  data: BarChartDataPoint[];
  valueFormatFn?: (value: number) => string;
  config?: Partial<BarChartConfig>;
  // isStacked?: boolean;
  isFullscreen?: boolean;
}>(), {
  par: null,
  valueFormatFn: value => value.toString(),
  config: () => ({ interval: 'week' }),
  isStacked: false,
  isFullscreen: false,
});

const DEFAULT_BAR_COLORS = {
  text: { light: themeColors.surface[900], dark: themeColors.surface[50] },
  secondaryText: { light: themeColors.surface[300], dark: themeColors.surface[600] },
  background: { light: themeColors.surface[0], dark: themeColors.surface[800] },

  cycle: {
    light: [themeColors.primary[500], twColors.red[500], twColors.orange[500], twColors.yellow[500], twColors.green[500], twColors.blue[500], twColors.purple[500]],
    dark: [themeColors.primary[400], twColors.red[400], twColors.orange[400], twColors.yellow[400], twColors.green[400], twColors.blue[400], twColors.purple[400]],
  },
};
const colorScheme = computed(() => {
  const preferredColorScheme = useTheme().theme.value;
  return {
    text: DEFAULT_BAR_COLORS.text[preferredColorScheme],
    secondaryText: DEFAULT_BAR_COLORS.secondaryText[preferredColorScheme],
    background: DEFAULT_BAR_COLORS.background[preferredColorScheme],
    cycle: DEFAULT_BAR_COLORS.cycle[preferredColorScheme],
  };
});

// now start configuring the chart
const plotContainer = useTemplateRef('plotContainer');
const plotContainerWidth = ref(0);
onMounted(() => {
  useResizeObserver(plotContainer, entries => {
    plotContainerWidth.value = entries[0].contentRect.width;
  });

  watchEffect(() => {
    if(!plotContainer.value) { return; }

    const marks: Plot.Markish[] = [
      Plot.ruleY([0]),
    ];

    marks.push(
      Plot.rectY(props.data, Plot.binX<Plot.RectYOptions>({ y: 'sum' }, {
        x: { value: 'date', thresholds: props.config.interval },
        y: 'value',
        fill: 'series',
      })),
      Plot.tip(props.data, Plot.pointerX(Plot.stackY2({ x: 'date', y: 'value', fill: 'series' }))),
    );

    const chart = Plot.plot({
      style: {
        fontFamily: 'Jost, sans-serif',
        fontSize: '0.75rem',
      },
      // the plot should be a 16:9 aspect ratio
      width: plotContainerWidth.value,
      height: (plotContainerWidth.value * 9) / 16,
      color: {
        type: 'categorical',
        range: colorScheme.value.cycle,
        legend: true,
      },
      x: {
        type: 'time',
      },
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

  min-height: 12rem;
  max-height: calc(100vh - 4rem);
  max-width: 100%;
}

.line-chart-container-fullscreen {
  height: calc(100vh - 4rem);
  width: calc(100vw - 4rem);
}
</style>
