<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue';

import { type ValueEnum } from 'server/lib/obj';
import { type LeaderboardMeasure } from 'server/lib/models/leaderboard/consts';
import { type SeriesInfoMap, type SeriesTallyish, createChartSeries, createParSeries, determineChartIntervals } from './chart-functions';
import { formatDate } from 'src/lib/date';
import { saveSvgAsPng } from 'src/lib/image';

import { PrimeIcons } from 'primevue/api';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import LineChart from './LineChart.vue';
import BarChart from './BarChart.vue';
import { filenameify } from 'src/lib/str';

const props = withDefaults(defineProps<{
  tallies: SeriesTallyish[];
  measureHint: LeaderboardMeasure;
  seriesInfo: SeriesInfoMap;
  startDate?: string | null;
  endDate?: string | null;
  startingTotal?: number;
  goalCount?: number | null;
  showLegend?: boolean;
  forceSeriesNameInTooltip?: boolean;
  graphTitle?: string;
}>(), {
  startDate: null,
  endDate: null,
  startingTotal: 0,
  goalCount: null,
  showLegend: true,
  forceSeriesNameInTooltip: false,
  graphTitle: 'trackbear',
});

const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
} as const;
type ChartType = ValueEnum<typeof CHART_TYPES>;

const chartTypeSettings = {
  [CHART_TYPES.LINE]: {
    label: 'Line',
    icon: PrimeIcons.CHART_LINE,
    accumulate: true,
    densify: false,
    extend: false,
  },
  [CHART_TYPES.BAR]: {
    label: 'Bar',
    icon: PrimeIcons.CHART_BAR,
    accumulate: false,
    densify: true,
    extend: false,
  },
};

const selectedChartType = ref<ChartType>(CHART_TYPES.LINE);

const chartIntervals = computed(() => {
  return determineChartIntervals(props.tallies, props.startDate, props.endDate);
});

const allSeries = computed(() => {
  const groupedBySeries = Object.groupBy(props.tallies, tally => tally.series) as Record<string, SeriesTallyish[]>;
  const dataPoints = Object.entries(groupedBySeries)
    .flatMap(([seriesUuid, seriesTallies]) => createChartSeries(seriesTallies, {
      accumulate: chartTypeSettings[selectedChartType.value].accumulate,
      densify: chartTypeSettings[selectedChartType.value].densify,
      extend: chartTypeSettings[selectedChartType.value].extend,
      startDate: chartIntervals.value.startDate,
      endDate: chartIntervals.value.endDate,
      earliestData: chartIntervals.value.earliestData,
      latestData: chartIntervals.value.latestData,
      startingTotal: props.startingTotal, // only matters if `accumulate` is `true`, so no need to ?: here too
      series: seriesUuid,
    }));

  return dataPoints;
});

const par = computed(() => {
  if(props.goalCount === null) {
    return null;
  }

  const parSeries = createParSeries(props.goalCount, {
    accumulate: !!(chartTypeSettings[selectedChartType.value].accumulate && props.endDate),
    startDate: chartIntervals.value.startDate,
    endDate: chartIntervals.value.endDate,
  });

  return parSeries;
});

const chartDialogRef = useTemplateRef('chart-dialog');
const showFullscreen = ref<boolean>(false);
function handleClickFullscreen() {
  showFullscreen.value = true;
  // @ts-expect-error for some reason, the `maximized` property isn't on the Dialog type
  chartDialogRef.value.maximized = true;
}

const progressChartRef = useTemplateRef('progress-chart');
function handleClickSave() {
  if(!progressChartRef.value) { return; }

  const svgEl = progressChartRef.value.querySelector('svg[class^="plot-"]') as SVGSVGElement;
  const filename = `${filenameify(props.graphTitle)}-${formatDate(new Date())}.png`;
  saveSvgAsPng(svgEl, filename);
}

</script>

<template>
  <div
    ref="progress-chart"
    class="flex flex-col gap-0"
  >
    <div class="flex gap-1 justify-end p-1">
      <Button
        v-for="(settings, type) of chartTypeSettings"
        :key="type"
        :aria-label="settings.label"
        :title="settings.label"
        :icon="settings.icon"
        text
        severity="secondary"
        size="small"
        @click="selectedChartType = type"
      />
      <Button
        aria-label="Fullscreen"
        title="Fullscreen"
        :icon="PrimeIcons.EXPAND"
        text
        severity="secondary"
        size="small"
        @click="handleClickFullscreen"
      />
      <Button
        aria-label="Save"
        title="Save"
        :icon="PrimeIcons.SAVE"
        text
        severity="secondary"
        size="small"
        @click="handleClickSave"
      />
    </div>
    <div>
      <LineChart
        v-if="selectedChartType === CHART_TYPES.LINE"
        :data="allSeries"
        :par="par"
        :measure-hint="props.measureHint"
        :series-info="seriesInfo"
        :show-legend="props.showLegend"
        :force-series-name-in-tooltip="props.forceSeriesNameInTooltip"
      />
      <BarChart
        v-if="selectedChartType === CHART_TYPES.BAR"
        :data="allSeries"
        :par="par"
        :measure-hint="props.measureHint"
        :stacked="true"
        :series-info="seriesInfo"
        :show-legend="props.showLegend"
        :force-series-name-in-tooltip="props.forceSeriesNameInTooltip"
      />
    </div>
    <Dialog
      ref="chart-dialog"
      v-model:visible="showFullscreen"
      :header="props.graphTitle"
      modal
    >
      <div
        class="flex w-full h-full justify-center items-center"
      >
        <LineChart
          v-if="selectedChartType === CHART_TYPES.LINE"
          class="grow"
          :data="allSeries"
          :par="par"
          :measure-hint="props.measureHint"
          :series-info="props.seriesInfo"
          :show-legend="props.showLegend"
          :force-series-name-in-tooltip="props.forceSeriesNameInTooltip"
        />
        <BarChart
          v-if="selectedChartType === CHART_TYPES.BAR"
          class="grow"
          :data="allSeries"
          :par="par"
          :measure-hint="props.measureHint"
          :stacked="true"
          :series-info="props.seriesInfo"
          :show-legend="props.showLegend"
          :force-series-name-in-tooltip="props.forceSeriesNameInTooltip"
        />
      </div>
    </Dialog>
  </div>
</template>
