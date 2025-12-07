<script setup lang="ts">
import { computed } from 'vue';

import type { Tally } from 'src/lib/api/tally.ts';
import { getStreakInfo } from 'src/lib/streak.ts';
// import { getRandomElement } from 'src/lib/arr.ts';

import StatTile from '../goal/StatTile.vue';

const props = defineProps<{
  tallies: Tally[];
}>();

const streakInfo = computed(() => {
  return getStreakInfo(props.tallies);
});

// const currentStreakEncouragment = computed(() => {
//   const current = streakInfo.value.currentStreak.length;
//   const longest = streakInfo.value.longestStreak.length;
//   if(current === 0) {
//     return 'go do some writing!';
//   } else if(current === longest) {
//     return 'a personal best!';
//   } else if(current < 7) {
//     return 'keep it up!';
//   } else if(current === 7) {
//     return 'one whole week!';
//   } else if(current < 14) {
//     return 'on a roll!';
//   } else if(current === 14) {
//     return 'one whole fortnight!';
//   } else {
//     return getRandomElement([
//       'heck yeah!',
//       'way to go!',
//       'keep going!',
//     ]);
//   }
// });

// const longsstStreakEncouragment = computed(() => {
//   const current = streakInfo.value.currentStreak.length;
//   const longest = streakInfo.value.longestStreak.length;
//   const isCurrentLongest = streakInfo.value.isCurrentStreakLongest;
//   const hasEnteredProgressToday = streakInfo.value.hasEnteredProgressToday;
//   if(current === 0) {
//     return 'go do some writing!';
//   } else if(current === longest) {
//     return 'a personal best!';
//   } else if(current < 7) {
//     return 'keep it up!';
//   } else if(current === 7) {
//     return 'one whole week!';
//   } else if(current < 14) {
//     return 'on a roll!';
//   } else if(current === 14) {
//     return 'one whole fortnight!';
//   } else {
//     return getRandomElement([
//       'heck yeah!',
//       'way to go!',
//       'keep going!',
//     ]);
//   }
// });

</script>

<template>
  <div class="flex gap-2">
    <StatTile
      top-legend="your current streak is"
      :highlight="streakInfo.currentStreak.length"
      :suffix="streakInfo.currentStreak.length === 1 ? 'day' : 'days'"
    />
    <StatTile
      top-legend="your longest streak is"
      :highlight="streakInfo.longestStreak.length"
      :suffix="streakInfo.longestStreak.length === 1 ? 'day' : 'days'"
    />
  </div>
</template>

<style scoped>
</style>
