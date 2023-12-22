<script setup lang="ts">
import { computed } from 'vue';
import { Project, TYPE_INFO } from '../../lib/project.ts';
import { formatDuration } from 'date-fns';

const props = defineProps<{ project: Project }>();

const timeframe = computed(() => {
  if(props.project.startDate && props.project.endDate) {
    return {
      title: props.project.goal ? 'between' : 'timeframe',
      text: `${props.project.startDate} and ${props.project.endDate}`,
    };
  } else if(props.project.startDate) {
    return {
      title: props.project.goal ? 'starting' : 'start date',
      text: `${props.project.startDate}`,
    };
  } else if(props.project.endDate) {
    return {
      title: props.project.goal ? 'by' : 'end date',
      text: `${props.project.endDate}`,
    };
  } else {
    return null;
  }
});

</script>

<template>
  <VaCard>
    <VaCardTitle v-if="props.project.goal">
      Your goal is to hit
    </VaCardTitle>
    <VaCardContent
      v-if="props.project.goal"
      class="text-center text-xl/4"
    >
      {{ props.project.type === 'time' ? formatDuration({ hours: Math.floor(props.project.goal / 60), minutes: props.project.goal % 60 }) : props.project.goal }}
      {{ props.project.type === 'time' ? '' : TYPE_INFO[props.project.type].counter.plural }}
    </VaCardContent>
    <VaCardTitle v-if="timeframe">
      {{ timeframe.title }}
    </VaCardTitle>
    <VaCardContent
      v-if="timeframe"
      class="text-center text-xl/4"
    >
      {{ timeframe.text }}
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
