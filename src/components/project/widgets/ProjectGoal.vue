<script setup lang="ts">
import { computed } from 'vue';
import { TYPE_INFO } from 'src/lib/project.ts';
import { Project } from '@prisma/client';
import { SharedProjectWithUpdates } from 'server/api/share.ts';

const props = defineProps<{
  project: Project | SharedProjectWithUpdates;
  addressUser?: boolean;
}>();

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
      {{ props.addressUser ? 'Your' : 'The' }} goal is to hit
    </VaCardTitle>
    <VaCardContent
      v-if="props.project.goal"
      class="text-center text-xl/4"
    >
      {{ props.project.goal }}
      {{ TYPE_INFO[props.project.type].counter[props.project.goal === 1 ? 'singular' : 'plural'] }}
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
