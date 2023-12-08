<script setup lang="ts">

import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale);

const chartData = {
  labels: Array(12).fill(null).map((_, ix) => `January ${ix + 1}`),
  datasets: [ { data: [ 0,  1584,  2129, 5977,  6439,  8207, 11105, 11386, 13195, 15354, 17310, 19516 ] } ],
};

const chartOptions = {
  plugins: {
    legend: {
      display: false,
    },
  },
  responsive: true
};

// import type { Project } from '../lib/project.ts';

// defineProps<{ project: Project }>()
</script>

<template>
  <VaCard class="h-full">
    <VaCardTitle>Progress So Far</VaCardTitle>
    <VaCardContent>
      <Line
        id="my-chart-id"
        :options="chartOptions"
        :data="chartData"
      />
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
