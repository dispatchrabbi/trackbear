<script setup lang="ts">
import { computed } from 'vue';

import { useColors } from 'vuestic-ui';
const { getColor } = useColors();

import { kify } from 'src/lib/number.ts';
import { formatDuration } from 'src/lib/date.ts';
import { TYPE_INFO } from 'src/lib//project.ts';
import type { ProjectWithUpdates } from 'server/api/projects.ts';

import LineChart from 'src/components/chart/LegacyLineChart.vue';
import type { LineChartOptions } from 'src/components/chart/LegacyLineChart.vue';
import { normalizeUpdates, getEachDayOfChart, calculatePars, makeTooltipLabelFn } from 'src/components/chart/legacy-chart-functions.ts';

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
  isFullscreen?: boolean;
}>();

const normalizedProject = computed(() => ({
  ...props.project,
  updates: normalizeUpdates(props.project.updates),
}));

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
const eachDay = computed(() => getEachDayOfChart(props.project.startDate, props.project.endDate, extremeUpdateDates.value.first, extremeUpdateDates.value.last));

const normalizedGoal = computed(() => {
  if(props.project.type === 'time') {
    // time goals are in hours, so we convert them to minutes
    return props.project.goal === null ? null : (props.project.goal * 60);
  } else {
    return props.project.goal;
  }
});

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
      counter: TYPE_INFO[project.type].counter,
      data: calculatePars(eachDay.value, normalizedGoal.value, props.project.endDate),
      // TODO: I don't understand why leaving this in is necessary to let the chart change colors
      // when the theme changes but I don't have time to dive in, so, for now... it's a mystery!
      borderColor: getColor('success'),
    });
  }

  return data;
});

const chartOptions = computed(() => {
  const tooltip = props.showTooltips ?
    {
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
        suggestedMin: 0,
        suggestedMax: normalizedGoal.value || TYPE_INFO[props.project.type].defaultChartMax,
        ticks: {
          callback: props.project.type === 'time' ? value => formatDuration(value, true) : value => kify(value),
          stepSize: props.project.type === 'time' ? 60 : undefined,
        },
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
    }
  };

  return options as LineChartOptions;
});

</script>

<template>
  <LineChart
    :data="chartData"
    :options="chartOptions"
    :is-fullscreen="isFullscreen"
  />
</template>src/components/chart/legacy-chart-functions
