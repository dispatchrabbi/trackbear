<script setup lang="ts">
import { computed } from 'vue';
import { eachDayOfInterval, addDays } from 'date-fns';

import { useColors } from 'vuestic-ui';
const { getColor } = useColors();

import { parseDateString, formatDate, formatTimeProgress, maxDateStr } from 'src/lib//date.ts';
import { TYPE_INFO } from 'src/lib//project.ts';
import type { ProjectWithUpdates } from 'server/api/projects.ts';

import LineChart from 'src/components/chart/LineChart.vue';
import type { LineChartOptions } from 'src/components/chart/LineChart.vue';

type ReducedUpdate = { date: string; value: number; };
type ReducedProjectWithUpdates = Pick<
  ProjectWithUpdates,
  'title' | 'type' | 'goal' | 'startDate' | 'endDate'
> & { updates: ReducedUpdate[] };

const props = defineProps<{
  project: ReducedProjectWithUpdates;
  showPar?: boolean;
  showTooltips?: boolean;
  showLegend?: boolean;
}>();

type NormalizedUpdate = {
  date: string;
  rawValue: number;
  rawTotalSoFar: number;
  value: number;
  totalSoFar: number;
};
function normalizeProjectUpdates(project: ReducedProjectWithUpdates): NormalizedUpdate[] {
  const updates = project.updates;

  // first, combine all the updates that happened on the same day
  const consolidatedObj: Record<string, number> = updates.reduce((obj, update) => {
    if(!(update.date in obj)) {
      obj[update.date] = 0;
    }

    obj[update.date] += update.value;
    return obj;
  }, {});
  let consolidatedDates = Object.keys(consolidatedObj);
  const consolidatedUpdates = consolidatedDates.sort().map(date => ({ date, value: consolidatedObj[date] }));

  const normalizedUpdates: NormalizedUpdate[] = [];
  // we have to use a for loop because .map doesn't update the array as it's going,
  // and we need access to the previous update's running total
  for(let i = 0; i < consolidatedUpdates.length; ++i) {
    const update = consolidatedUpdates[i];

    const rawValue = update.value;
    const value = rawValue;
    const rawTotalSoFar = (i === 0 ? rawValue : rawValue + normalizedUpdates[i - 1].rawTotalSoFar);
    // calculate this from scratch each time so we don't depend on floating point math to eventually add to 100.0
    const totalSoFar = rawTotalSoFar;

    normalizedUpdates.push({
      date: update.date,
      rawValue,
      rawTotalSoFar,
      value,
      totalSoFar,
    });
  }

  return normalizedUpdates;
}
const normalizedProject = computed(() => ({
  ...props.project,
  updates: normalizeProjectUpdates(props.project),
}));

function determineChartStartDate(firstUpdate?: string, leaderboardStartDate?: string) {
  if(leaderboardStartDate) {
    return leaderboardStartDate;
  } else if(firstUpdate) {
    return firstUpdate
  } else {
    return formatDate(new Date()); // today
  }
}
function determineChartEndDate(lastUpdate?: string, projectEndDate?: string, projectStartDate?: string) {
  if(projectEndDate) {
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
function eachDayOfProject(project: ReducedProjectWithUpdates, firstUpdate?: string, lastUpdate?: string ) {
  const start = determineChartStartDate(firstUpdate, project.startDate);
  const end = determineChartEndDate(lastUpdate, project.endDate, project.startDate);

  let dates = { start: parseDateString(start), end: parseDateString(end) };
  if(dates.end < dates.start) {
    dates = { start: dates.end, end: dates.start };
  }

  const eachDay = eachDayOfInterval(dates).map(formatDate).sort();
  return eachDay;
}
const extremeUpdateDates = computed(() => {
  // use a Set to uniquify the collection of dates across projects
  const dateSet = new Set<string>();
  for(let update of normalizedProject.value.updates) {
    dateSet.add(update.date);
  }

  const orderedDates = [...dateSet].sort();
  return {
    first: orderedDates.length ? orderedDates[0] : null,
    last: orderedDates.length ? orderedDates[orderedDates.length - 1] : null,
  };
});
const eachDay = computed(() => eachDayOfProject(props.project, extremeUpdateDates.value.first, extremeUpdateDates.value.last));

const normalizedGoal = computed(() => {
  if(props.project.type === 'time') {
    // time goals are in hours, so we convert them to minutes
    return props.project.goal === null ? null : (props.project.goal * 60);
  } else {
    return props.project.goal;
  }
});

function calculatePars(eachDay: string[], project: ReducedProjectWithUpdates) {
  // no way to have par if there's no goal
  if(normalizedGoal.value === null) {
    return null;
  }

  let pars = [];
  if(project.endDate) {
    // count up toward the end date
    const parPerDay = normalizedGoal.value / (eachDay.length);
    pars = eachDay.map((dateStr, ix) => ({
      date: dateStr,
      value: parPerDay,
      totalSoFar: parPerDay * (ix + 1), // start the par line at the first day's goal, not 0
    }));
  } else {
    // just put par at the goal
    pars = eachDay.map((dateStr) => ({
      date: dateStr,
      value: normalizedGoal.value,
      totalSoFar: normalizedGoal.value,
    }));
  }

  return pars;
}
const pars = computed(() => props.showPar ? calculatePars(eachDay.value, props.project) : null);

const chartData = computed(() => {
  const data = {
    labels: eachDay.value,
    datasets: [],
  };

  const project = normalizedProject.value;
  data.datasets.push({
    label: project.title,
    counter: TYPE_INFO[project.type].counter,
    data: project.updates.filter(update => eachDay.value.includes(update.date)),
  });

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

function makeTooltipLabelFn(projectType) {
  if(projectType === 'time') {
    return ctx => `${formatTimeProgress(ctx.raw.totalSoFar)}`;
  } else {
    return ctx => `${ctx.raw.totalSoFar} ${(ctx.raw.totalSoFar === 1 ? ctx.dataset.counter.singular : ctx.dataset.counter.plural)}`;
  }
}
const chartOptions = computed(() => {
  const tooltip = props.showTooltips ?
    {
      filter: ctx => ctx.dataset.label !== 'Par', // even if showing tooltips, don't show them for Par
      callbacks: {
        label: makeTooltipLabelFn(props.project.type),
      },
    } :
    { enabled: false };

  const options = {
    parsing: {
      xAxisKey: 'date',
      yAxisKey: 'totalSoFar'
    },
    scales: {
      y: {
        type: 'linear',
        min: 0,
        suggestedMax: normalizedGoal.value || TYPE_INFO[props.project.type].defaultChartMax,
        ticks: {
          callback: props.project.type === 'time' ? value => formatTimeProgress(value, true)  : undefined,
          stepSize: props.project.type === 'time' ? 60 : undefined,
        }
      },
    },
    plugins: {
      legend: {
        display: props.showLegend,
        position: 'bottom',
        // Don't show an item in the legend for Par
        labels: { filter: item => item.text !== 'Par' }
      },
      tooltip: tooltip,
    },
    animation: false,
    responsive: true,
    maintainAspectRatio: true,
  };

  return options as LineChartOptions;
});

</script>

<template>
  <LineChart
    class="leaderboard-chart"
    :data="chartData"
    :options="chartOptions"
  />
</template>
