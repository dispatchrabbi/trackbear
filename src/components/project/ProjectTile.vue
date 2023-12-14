<script setup lang="ts">
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale, ChartOptions } from 'chart.js';
ChartJS.register(Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale);

import { ProjectResponse } from '../../../server/api/projects';

defineProps<{ project: ProjectResponse }>();

const last7Days = Array(6).fill(null).map(() => Math.floor(Math.random() * 1200)).reduce((totals, count, ix) => {
  totals.push(count + totals[ix]);
  return totals;
}, [ 0 ]);

const chartData = {
  labels: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
  datasets: [ { data: last7Days } ],
};

const chartOptions: ChartOptions<'line'> = {
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false,
    },
  },
  animation: false,
  responsive: true,
  maintainAspectRatio: false,
};

</script>

<template>
  <VaCard>
    <VaCardTitle>
      <h2 class="text-lg">
        {{ project.title }}
      </h2>
    </VaCardTitle>
    <VaCardContent>
      <Line
        :id="`project-tile-chart-${ project.id }`"
        class="project-tile-chart"
        :options="chartOptions"
        :data="chartData"
      />
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
  .project-tile-chart {
    min-height: 12rem;
  }
</style>
