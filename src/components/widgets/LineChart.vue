<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { debounce } from 'chart.js/helpers';

import { useColors } from 'vuestic-ui';
const { getColor } = useColors();

import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale, ChartData } from 'chart.js';

ChartJS.register(Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale);
// change axis color
ChartJS.defaults.color = getColor('secondary');
ChartJS.defaults.borderColor = getColor('backgroundBorder');

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
