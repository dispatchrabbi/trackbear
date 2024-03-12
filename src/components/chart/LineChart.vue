<script setup lang="ts">
import { computed, toValue, defineProps } from 'vue';

import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineController, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { provideLineChartDataDefaults, provideLineChartOptionsDefaults } from './line-chart-defaults.ts';

export type LineChartOptions = ChartOptions<'line'>;
export type LineChartData = ChartData<'line'>;

const props = defineProps<{
  id?: string;
  options?: LineChartOptions;
  data: LineChartData;

  noDefaults?: boolean;
  isFullscreen?: boolean;
}>();

ChartJS.register(Title, Tooltip, LineController, Legend, LineElement, PointElement, CategoryScale, LinearScale);

const options = computed(() => {
  const propsOptions = toValue(props.options ?? { });

  if(props.noDefaults) {
    return propsOptions;
  } else {
    return provideLineChartOptionsDefaults(propsOptions);
  }
});

const data = computed(() => {
  const propsData = toValue(props.data);

  if(props.noDefaults) {
    return propsData;
  } else {
    return provideLineChartDataDefaults(propsData);
  }
});

</script>

<template>
  <div
    :class="[
      'line-chart-container',
      isFullscreen ? 'line-chart-container-fullscreen' : null,
      options.plugins?.legend?.display ? 'line-chart-container-with-legend' : null
    ]"
  >
    <Line
      :id="props.id"
      :options="options"
      :data="data"
    />
  </div>
</template>

<style scoped>
.line-chart-container {
  position: relative;
  margin: auto;

  /* this is all to keep the chart nicely-sized for desktop and mobile
     fullscreen is another ball of wax */
  aspect-ratio: calc(16 / 9);
  min-height: 12rem;
  max-height: calc(100vh - 4rem);
  max-width: 100%;
}

.line-chart-container-with-legend {
  min-height: 14rem;
}

.line-chart-container-fullscreen {
  height: calc(100vh - 4rem);
  width: calc(100vw - 4rem);
}
</style>./line-chart-defaults
