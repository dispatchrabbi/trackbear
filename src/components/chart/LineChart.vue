<script setup lang="ts">
import { useThemeStore } from '../../stores/theme.ts';
const themeStore = useThemeStore();

import { useColors } from 'vuestic-ui';
const { getColor } = useColors();

import { Line } from 'vue-chartjs';
import makeTrackbearStylesPlugin from './TrackbearStylesPlugin.ts';
import { Chart as ChartJS, Title, Tooltip, Legend, LineController, LineElement, PointElement, CategoryScale, LinearScale, ChartData } from 'chart.js';

ChartJS.register(Title, Tooltip, LineController, Legend, LineElement, PointElement, CategoryScale, LinearScale);

ChartJS.register(makeTrackbearStylesPlugin(getColor));
// whenever the theme changes, we need to redo the colors
themeStore.$subscribe(() => {
  ChartJS.unregister(makeTrackbearStylesPlugin(getColor));
  ChartJS.register(makeTrackbearStylesPlugin(getColor));
});

ChartJS.defaults.animation = false;
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;

export type LineChartOptions = InstanceType<typeof Line>['$props']['options'];

const props = defineProps<{
  id?: string;
  options?: LineChartOptions;
  data: ChartData<'line'>;
  isFullscreen?: boolean;
}>();

</script>

<template>
  <div
    ref="chartContainer"
    :class="['chart-container', isFullscreen ? 'chart-container-fullscreen' : null]"
  >
    <Line
      :id="props.id"
      ref="chart"
      :options="props.options"
      :data="props.data"
    />
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  margin: auto;

  /* this is all to keep the chart nicely-sized for desktop and mobile
     fullscreen is another ball of wax */
  aspect-ratio: calc(16 / 9);
  min-height: 12rem;
  max-height: calc(100vh - 4rem);
  max-width: 100%;
}

.chart-container-fullscreen {
  height: calc(100vh - 4rem);
  width: calc(100vw - 4rem);
}
</style>
