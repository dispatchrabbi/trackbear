<script setup lang="ts">
import { computed } from 'vue';

import type { CompleteLeaderboard } from '../../../server/api/leaderboards.ts';
import { GOAL_TYPE_INFO } from '../../lib/api/leaderboard.ts';

const props = defineProps<{
  leaderboard: CompleteLeaderboard;
}>();

const timeframe = computed(() => {
  if(props.leaderboard.startDate && props.leaderboard.endDate) {
    return {
      title: props.leaderboard.goal ? 'between' : 'timeframe',
      text: `${props.leaderboard.startDate} and ${props.leaderboard.endDate}`,
    };
  } else if(props.leaderboard.startDate) {
    return {
      title: props.leaderboard.goal ? 'starting' : 'start date',
      text: `${props.leaderboard.startDate}`,
    };
  } else if(props.leaderboard.endDate) {
    return {
      title: props.leaderboard.goal ? 'by' : 'end date',
      text: `${props.leaderboard.endDate}`,
    };
  } else {
    return null;
  }
});

// TODO: I'm not sure I like this part of the section
// const counts = computed(() => {
//   const projects = props.leaderboard.projects.length;

//   const participants = props.leaderboard.projects
//     .map(project => project.owner.uuid)
//     .reduce((set, uuid) => set.add(uuid), new Set<string>())
//     .size;

//   return {
//     projects,
//     participants
//   };
// });

</script>

<template>
  <VaCard>
    <VaCardTitle v-if="props.leaderboard.goal || props.leaderboard.type === 'percentage'">
      The goal is to hit
    </VaCardTitle>
    <VaCardContent
      v-if="props.leaderboard.goal"
      class="text-center text-xl/4"
    >
      {{ props.leaderboard.goal }}
      {{ GOAL_TYPE_INFO[props.leaderboard.type].counter[props.leaderboard.goal === 1 ? 'singular' : 'plural'] }}
    </VaCardContent>
    <VaCardContent
      v-if="props.leaderboard.type === 'percentage'"
      class="text-center text-xl/4"
    >
      100% of your own goal!
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
    <!-- <VaCardTitle>
      Number of Participants
    </VaCardTitle>
    <VaCardContent>
      {{ counts.participants }} {{ counts.participants === 1 ? 'person' : 'people' }}
    </VaCardContent>
    <VaCardTitle>
      Number of Projects
    </VaCardTitle>
    <VaCardContent>
      {{ counts.projects }} {{ counts.projects === 1 ? 'project' : 'projects' }}
    </VaCardContent> -->
  </VaCard>
</template>

<style scoped>
</style>
