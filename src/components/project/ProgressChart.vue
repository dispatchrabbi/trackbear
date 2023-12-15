<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { differenceInCalendarDays, subDays } from 'date-fns';
import { debounce } from 'chart.js/helpers';

import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';
ChartJS.register(Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale);

import { parseDateString, formatTimeProgress } from '../../lib/date.ts';
import type { Project, Update, TYPE_INFO } from '../../lib/project.ts';
type NormalizedUpdate = {
  date: string;
  today: number;
  soFar: number;
};

const props = defineProps<{
  id: string;
  class?: string;
  project: Project;
  updates: Update[];
  showPar: boolean;
  showTooltips: boolean;
}>();

// TODO: fill in sparse datasets
function normalizeUpdates(updates: Update[]): NormalizedUpdate[] {
  // combine all the updates for a single day
  const consolidated = updates.reduce((obj, update) => {
    if(!(update.date in obj)) {
      obj[update.date] = 0;
    }

    obj[update.date] += update.value;
    return obj;
  }, {});

  const normalized = Object.keys(consolidated)
    .map(date => ({ date, today: consolidated[date], soFar: 0 })) // reorg into an array
    .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0); // sort by date

  // need a for loop because we need to react to changing the previous element and .map doesn't do that
  for(let i = 0; i < normalized.length; ++i) {
    const update = normalized[i];
    update.soFar = update.today + (i > 0 ? normalized[i - 1].soFar : 0)
  }

  return normalized;
}
const updates = computed(() => normalizeUpdates(props.updates));


function calculatePars(updates: NormalizedUpdate[], project: Project) {
  const doesParEvenMakeSense = project.goal !== null && project.endDate !== null;
  if(!doesParEvenMakeSense) {
    return null;
  }

  if(updates.length < 1) {
    return null;
  }

  // startDate is day 1, not day 0 - you expect to hit par on day 1. So we need a zeroDate to calculate from
  const zeroDate = subDays(parseDateString(project.startDate || updates[0].date), 1);
  const endDate = parseDateString(project.endDate);
  const projectLengthInDays = differenceInCalendarDays(endDate, zeroDate);

  const parPerDay = project.goal / projectLengthInDays;
  const pars = updates.map(update => parPerDay * differenceInCalendarDays(parseDateString(update.date), zeroDate));

  return pars;
}
const pars = computed(() => props.showPar ? calculatePars(updates.value, props.project) : null);

const chartData = computed(() => {
  const data = {
    labels: updates.value.map(u => u.date),
    datasets: [],
  };

  // add the updates
  data.datasets.push({
    label: 'Progress',
    data: updates.value.map(u => u.soFar)
  });

  // add par?
  if(props.showPar) {
    data.datasets.push({
      label: 'Par',
      data: pars.value,
      elements: { point: { radius: 0 }, line: { borderDash: [ 3 ] } } // par line is dashed, no markers
    });
  }

  return data;
});

const chartOptions = computed(() => {
  const tooltip = props.showTooltips ?
    // even if showing tooltips, don't show them for Par
    {
      filter: ctx => ctx.dataset.label !== 'Par',
      callbacks: props.project.type === 'time' ? { label: ctx => `${ctx.dataset.label}: ${formatTimeProgress(ctx.parsed.y)}` } : undefined,
    } :
    { enabled: false };

  const options = {
    scales: {
      y: {
        min: 0,
        suggestedMax: props.project.goal || TYPE_INFO[props.project.type].defaultChartMax,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: tooltip,
    },
    animation: false,
    responsive: true,
    maintainAspectRatio: true,
  };

  return options;
});

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
      :class="['progress-chart', props.class]"
      :options="chartOptions"
      :data="chartData"
    />
  </div>
</template>

<style scoped>

</style>
