<script setup lang="ts">
import { computed, defineProps, toValue } from 'vue';

import { Chart as ChartJS, Title, Tooltip, Legend, TimeScale, LinearScale } from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import { createTypedChart } from 'vue-chartjs';
import { provideMatrixChartDataDefaults, provideMatrixChartOptionsDefaults, calculateChartWidth, calculateChartHeight } from './calendar-matrix-chart-defaults.ts';

export type MatrixChartOptions = ChartOptions<'matrix'>;
export type MatrixChartData = ChartData<'matrix'>;

const props = defineProps<{
  id?: string;
  options?: MatrixChartOptions;
  data: MatrixChartData;

  // TODO: make it so this can do weeks/months as well as days
  highlightToday?: boolean;
  noDefaults?: boolean;
}>();

ChartJS.register(MatrixController, MatrixElement, Title, Tooltip, Legend, TimeScale, LinearScale);
ChartJS.defaults.font.family = 'Jost, sans-serif';

// create the actual chart-drawing component (see: https://vue-chartjs.org/guide/#custom-new-charts)
const Matrix = createTypedChart('matrix', MatrixController);

const options = computed(() => {
  const propsOptions = toValue(props.options ?? { });

  if(props.noDefaults) {
    return propsOptions;
  } else {
    return provideMatrixChartOptionsDefaults(propsOptions);
  }
});

const data = computed(() => {
  const propsData = toValue(props.data);

  if(props.noDefaults) {
    return propsData;
  } else {
    return provideMatrixChartDataDefaults(propsData, { highlightToday: props.highlightToday });
  }
});

const width = computed(() => {
  return calculateChartWidth(data.value);
});

const height = computed(() => {
  return calculateChartHeight();
});

</script>

<template>
  <div class="matrix-chart-container-container overflow-x-auto">
    <div class="matrix-chart-scroll-container">
      <div
        class="matrix-canvas-container position-relative"
        :style="{
          width: width + 'px',
          height: height + 'px',
        }"
      >
        <Matrix
          :id="props.id"
          :options="options"
          :data="data"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
