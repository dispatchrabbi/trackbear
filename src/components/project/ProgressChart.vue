<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { eachDayOfInterval } from 'date-fns';
import { debounce } from 'chart.js/helpers';

import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';
ChartJS.register(Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale);

import { parseDateString, formatDate, formatTimeProgress, minDateStr, maxDateStr } from '../../lib/date.ts';
import { Project, Update, TYPE_INFO } from '../../lib/project.ts';
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

function eachDayOfProject(updates: NormalizedUpdate[], project: Project) {
  // if there are no updates and we don't have both a start and end date, we have no interval to work with at all
  if(updates.length === 0 && !(project.startDate && project.endDate)) {
    return [];
  }

  const start = updates.length > 0 ? project.startDate ? minDateStr(project.startDate, updates[0].date) : updates[0].date : project.startDate;
  const end = updates.length > 0 ? project.endDate ? maxDateStr(project.endDate, updates[updates.length - 1].date) : updates[updates.length - 1].date : project.endDate;

  const eachDay = eachDayOfInterval({ start: parseDateString(start), end: parseDateString(end) });
  return eachDay;
}
const eachDay = computed(() => eachDayOfProject(updates.value, props.project));

function calculatePars(eachDay: Date[], project: Project) {
  // no way to have par if there's no goal
  if(project.goal === null) {
    return null;
  }

  if(eachDay.length < 1) {
    return null;
  }

  let pars = [];
  if(project.endDate) {
    // count up toward the end date
    const parPerDay = project.goal / eachDay.length;
    pars = eachDay.map((date, ix) => ({ date: formatDate(date), value: parPerDay * ix }));
  } else {
    // just put par at the goal
    pars = eachDay.map((date) => ({ date: formatDate(date), value: project.goal }));
  }

  return pars;
}
const pars = computed(() => props.showPar ? calculatePars(eachDay.value, props.project) : null);

const progressData = computed(() => {
  const progressPoints = updates.value.map(u => ({ date: u.date, value: u.soFar }));

  if(progressPoints.length > 0 && updates.value[0].date !== formatDate(eachDay.value[0])) {
    // need to add a zero at the beginning so it's not just floating
    progressPoints.unshift({ date: formatDate(eachDay.value[0]), value: 0 });
  }

  return progressPoints;
});

const chartData = computed(() => {
  const data = {
    labels: eachDay.value.map(date => formatDate(date)),
    datasets: [],
  };

  // add the updates
  data.datasets.push({
    label: 'Progress',
    data: progressData.value,
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
    parsing: {
      xAxisKey: 'date',
      yAxisKey: 'value'
    },
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

  return options as InstanceType<typeof Line>["$props"]["options"];
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
