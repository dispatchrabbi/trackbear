<script setup lang="ts">
import { computed, defineProps, toValue } from 'vue';

import { Chart as ChartJS, Title, Tooltip, Legend, TimeScale, LinearScale } from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import { createTypedChart } from 'vue-chartjs';
import { provideMatrixChartDataDefaults, provideMatrixChartOptionsDefaults  } from './calendar-matrix-chart-defaults.ts';

export type MatrixChartOptions = ChartOptions<'matrix'>;
export type MatrixChartData = ChartData<'matrix'>;

const props = defineProps<{
  id?: string;
  options?: MatrixChartOptions;
  data: MatrixChartData;

  // TODO: make it so this can do weeks/months as well as days
  noDefaults?: boolean;
  isFullscreen?: boolean;
}>();

ChartJS.register(MatrixController, MatrixElement, Title, Tooltip, Legend, TimeScale, LinearScale);

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
    return provideMatrixChartDataDefaults(propsData);
  }
});

</script>

<template>
  <div
    :class="[
      'matrix-chart-container',
      isFullscreen ? 'matrix-chart-container-fullscreen' : null,
      options.plugins?.legend?.display ? 'matrix-chart-container-with-legend' : null
    ]"
  >
    <Matrix
      :id="props.id"
      :options="options"
      :data="data"
    />
  </div>
</template>

<style scoped>
.matrix-chart-container {
  position: relative;
  margin: auto;

  /* this is all to keep the chart nicely-sized for desktop and mobile
     fullscreen is another ball of wax */
  aspect-ratio: calc(53/7);
  /* min-height: 12rem;
  max-height: calc(100vh - 4rem);
  max-width: 100%; */
  width: 100%;
}

/* .matrix-chart-container-with-legend {
  min-height: 14rem;
} */

.matrix-chart-container-fullscreen {
  height: calc(100vh - 4rem);
  width: calc(100vw - 4rem);
}
</style>./matrix-chart-defaults.ts
