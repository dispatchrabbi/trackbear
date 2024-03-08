<script setup lang="ts">
import { computed } from 'vue';

import { useColors } from 'vuestic-ui';
const { getColor } = useColors();

import { kify } from 'src/lib/number.ts';
import { formatDuration } from 'src/lib//date.ts';
import { GOAL_TYPE_INFO } from 'src/lib//api/leaderboard.ts';
import { TYPE_INFO } from 'src/lib//project.ts';
import type { CompleteLeaderboard } from 'server/api/leaderboards.ts';

import LineChart from 'src/components/chart/LegacyLineChart.vue';
import type { LineChartOptions } from 'src/components/chart/LegacyLineChart.vue';
import { normalizeUpdates, getEachDayOfChart, calculatePars, makeTooltipLabelFn } from 'src/components/chart/legacy-chart-functions.ts';

const props = defineProps<{
  leaderboard: CompleteLeaderboard;
  showPar?: boolean;
  showTooltips?: boolean;
  showLegend?: boolean;
  isFullscreen?: boolean;
}>();

const normalizedProjects = computed(() => props.leaderboard.projects.map(project => ({
  ...project,
  updates: normalizeUpdates(project.updates, props.leaderboard.type === 'percentage' ? { type: project.type, goal: project.goal } : null),
})));

const extremeUpdateDates = computed(() => {
  // use a Set to uniquify the collection of dates across projects
  const dateSet = new Set<string>();
  for(let project of normalizedProjects.value) {
    for(let update of project.updates) {
      dateSet.add(update.date);
    }
  }

  const orderedDates = [...dateSet].sort();
  return {
    first: orderedDates.length ? orderedDates[0] : null,
    last: orderedDates.length ? orderedDates[orderedDates.length - 1] : null,
  };
});
const eachDay = computed(() => getEachDayOfChart(props.leaderboard.startDate, props.leaderboard.endDate, extremeUpdateDates.value.first, extremeUpdateDates.value.last));

const normalizedGoal = computed(() => {
  if(props.leaderboard.type === 'percentage') {
    // the percentage goal is always 100
    return 100;
  } else if(props.leaderboard.type === 'time') {
    // time goals are in hours, so we convert them to minutes
    return props.leaderboard.goal === null ? null : (props.leaderboard.goal * 60);
  } else {
    return props.leaderboard.goal;
  }
});

const chartData = computed(() => {
  const data = {
    labels: eachDay.value,
    datasets: [],
  };

  for(let i = 0; i < normalizedProjects.value.length; ++i) {
    const project = normalizedProjects.value[i];

    data.datasets.push({
      label: project.owner.displayName,
      title: project.title,
      owner: project.owner.displayName,
      counter: TYPE_INFO[project.type].counter,
      data: project.updates.filter(update => eachDay.value.includes(update.date)),
    });
  }

  if(props.showPar) {
    data.datasets.push({
      label: 'Par',
      counter: GOAL_TYPE_INFO[props.leaderboard.type].counter,
      data: calculatePars(eachDay.value, normalizedGoal.value, props.leaderboard.endDate),
      borderColor: getColor('success'),
    });
  }

  return data;
});

const chartOptions = computed(() => {
  const tooltip = props.showTooltips ?
    {
      callbacks: {
        label: makeTooltipLabelFn(props.leaderboard.type),
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
        suggestedMax: normalizedGoal.value || GOAL_TYPE_INFO[props.leaderboard.type].defaultChartMax,
        ticks: {
          callback: props.leaderboard.type === 'time' ? value => formatDuration(value, true) : value => kify(value),
          stepSize: props.leaderboard.type === 'time' ? 60 : undefined,
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
