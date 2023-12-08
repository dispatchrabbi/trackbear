<script setup lang="ts">
import { ref } from 'vue';
import type { Project } from '../lib/project.ts';

type FakeProject = { id: number, title: string };

// defineProps<{ project: Project }>();
defineProps<{ project: FakeProject }>();

const last7Days = Array(6).fill(null).map(x => Math.floor(Math.random() * 1200)).reduce((totals, count, ix) => {
  totals.push(count + totals[ix]);
  return totals;
}, [ 0 ]);

import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale);

const chartData = {
  labels: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
  datasets: [ { data: last7Days } ],
};

const chartOptions = {
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false,
    },
  },
  responsive: true
};

</script>

<template>
  <VaCard>
    <VaCardTitle><h2 class="text-lg">{{ project.title }}</h2></VaCardTitle>
    <VaCardContent>
      <Line
        :id="`project-tile-chart-${ project.id }`"
        :options="chartOptions"
        :data="chartData"
      ></Line>
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
