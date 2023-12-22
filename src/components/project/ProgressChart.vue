<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { eachDayOfInterval, addDays } from 'date-fns';
import { debounce } from 'chart.js/helpers';

import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';
ChartJS.register(Title, Tooltip, LineController, LineElement, PointElement, CategoryScale, LinearScale);

import { useColors } from 'vuestic-ui';

import { parseDateString, formatDate, formatTimeProgress, minDateStr, maxDateStr } from '../../lib/date.ts';
import { Project, Update, TYPE_INFO } from '../../lib/project.ts';
import { SharedProjectWithUpdates } from '../../../server/api/share.ts';

// TODO: this isn't the cleanest; now we have two of these types floating around
type CommonUpdate = Omit<Update, 'id' | 'updatedAt'>;

type NormalizedUpdate = {
  date: string;
  today: number;
  soFar: number;
};

const props = defineProps<{
  id: string;
  class?: string;
  project: Project | SharedProjectWithUpdates;
  updates: CommonUpdate[]
  showPar: boolean;
  showTooltips: boolean;
}>();

function normalizeUpdates(updates: CommonUpdate[]): NormalizedUpdate[] {
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
const updates = computed(() => normalizeUpdates(props.project.updates));

function determineChartStartDate(firstUpdate?: string, projectStartDate?: string) {
  if(projectStartDate && firstUpdate) {
    return minDateStr(projectStartDate, firstUpdate);
  } else if(projectStartDate) {
    return projectStartDate;
  } else if(firstUpdate) {
    return firstUpdate
  } else {
    return formatDate(new Date()); // today
  }
}
function determineChartEndDate(lastUpdate?: string, projectEndDate?: string, projectStartDate?: string) {
  if(projectEndDate && lastUpdate) {
    return maxDateStr(projectEndDate, lastUpdate);
  } else if(projectEndDate) {
    return projectEndDate;
  } else if(lastUpdate) {
    return lastUpdate
  } else if(projectStartDate) {
    // display a 7-day chart
    return maxDateStr(formatDate(addDays(parseDateString(projectStartDate), 6)), formatDate(addDays(new Date(), 6)));
  } else {
    // display a 7-day chart
    return formatDate(addDays(new Date(), 6));
  }
}
function eachDayOfProject(updates: NormalizedUpdate[], project: SharedProjectWithUpdates) {
  const start = determineChartStartDate(updates.length > 0 ? updates[0].date : null, project.startDate);
  const end = determineChartEndDate(updates.length > 0 ? updates[updates.length - 1].date : null, project.endDate, project.startDate);

  const eachDay = eachDayOfInterval({ start: parseDateString(start), end: parseDateString(end) });
  return eachDay;
}
const eachDay = computed(() => eachDayOfProject(updates.value, props.project));

// time goals are in hours, so we convert them to minutes
const normalizedGoal = computed(() => {
  return props.project.goal === null ? null : (props.project.type === 'time' ? (props.project.goal * 60) : props.project.goal);
});

function calculatePars(eachDay: Date[], project: SharedProjectWithUpdates) {
  // no way to have par if there's no goal
  if(normalizedGoal.value === null) {
    return null;
  }

  let pars = [];
  if(project.endDate) {
    // count up toward the end date
    const parPerDay = normalizedGoal.value / (eachDay.length - 1);
    pars = eachDay.map((date, ix) => ({
      date: formatDate(date),
      value: parPerDay * ix,
    }));
  } else {
    // just put par at the goal
    pars = eachDay.map((date) => ({
      date: formatDate(date),
      value: normalizedGoal.value,
    }));
  }

  return pars;
}
const pars = computed(() => props.showPar ? calculatePars(eachDay.value, props.project) : null);

const progressData = computed(() => {
  const progressPoints = updates.value.map(u => ({
    date: u.date,
    value: u.soFar, // for time projects, show the value in hours, not minutes
  }));

  if(progressPoints.length > 0 && updates.value[0].date !== formatDate(eachDay.value[0])) {
    // need to add a zero at the beginning so it's not just floating
    progressPoints.unshift({ date: formatDate(eachDay.value[0]), value: 0 });
  }

  return progressPoints;
});

const { getColor } = useColors();

const chartData = computed(() => {
  const data = {
    labels: eachDay.value.map(date => formatDate(date)),
    datasets: [],
  };

  // add the updates
  data.datasets.push({
    label: 'Progress',
    data: progressData.value,
    borderColor: getColor('info'),
  });

  // add par?
  if(props.showPar) {
    data.datasets.push({
      label: 'Par',
      data: pars.value,
      borderColor: getColor('success'),
      elements: { point: { radius: 0 }, line: { borderDash: [ 8 ] } } // par line is dashed, no markers
    });
  }

  return data;
});

const chartOptions = computed(() => {
  // change axis color
  ChartJS.defaults.color = getColor('secondary');
  ChartJS.defaults.borderColor = getColor('backgroundBorder');

  const tooltip = props.showTooltips ?
    // even if showing tooltips, don't show them for Par
    {
      filter: ctx => ctx.dataset.label !== 'Par',
      callbacks: props.project.type === 'time' ? { label: ctx => `${ctx.dataset.label}: ${formatTimeProgress(ctx.raw.value)}` } : undefined,
    } :
    { enabled: false };

  const options = {
    parsing: {
      xAxisKey: 'date',
      yAxisKey: 'value'
    },
    scales: {
      y: {
        type: 'linear',
        min: 0,
        suggestedMax: normalizedGoal.value || TYPE_INFO[props.project.type].defaultChartMax,
        ticks: {
          callback: props.project.type === 'time' ? value => formatTimeProgress(value)  : undefined,
          stepSize: props.project.type === 'time' ? 60 : undefined,
        }
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
