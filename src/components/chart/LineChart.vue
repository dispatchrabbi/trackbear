<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { debounce } from 'chart.js/helpers';

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

export type LineChartOptions = InstanceType<typeof Line>['$props']['options'];

const props = defineProps<{
  id?: string;
  class?: string;
  options?: LineChartOptions;
  data: ChartData<'line'>;
}>();

const chart = ref(null);
const resizeChart = debounce(() => {
  if(chart.value && chart.value.chart) {
    const canvas: HTMLCanvasElement = chart.value.chart.canvas;
    canvas.style.height = null;
    canvas.style.width = null;
  }
}, 250);

onMounted(() => {
  window.addEventListener('resize', resizeChart);
  window.dispatchEvent(new Event('resize'));
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart);
});

</script>

<template>
  <div>
    <Line
      :id="props.id"
      ref="chart"
      :class="['leaderboard-chart', props.class]"
      :options="props.options"
      :data="props.data"
    />
  </div>
</template>
