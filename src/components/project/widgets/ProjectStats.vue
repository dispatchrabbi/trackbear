<script setup lang="ts">
import { computed } from 'vue';
import { addDays } from 'date-fns';

import type { ProjectWithUpdatesAndLeaderboards } from 'server/api/projects.ts'
import { parseDateString, formatDate } from 'src/lib/date.ts';

const props = defineProps<{ project: ProjectWithUpdatesAndLeaderboards }>();

function countStreaks(dates: string[]) {
  // uniquify and sort update dates from oldest to newest
  const updateDates = [...(new Set(dates))].sort();

  const streaks: number[] = [];
  let cursor = parseDateString(updateDates[0]);
  let streakLength = 0;

  for(const date of updateDates) {
    if(formatDate(cursor) === date) {
      streakLength++;
    } else {
      // new streak, save the last streak
      streaks.push(streakLength);

      // start a new streak from today
      streakLength = 1;
      cursor = parseDateString(date);
    }

    // finally, set the cursor to the next day
    cursor = addDays(cursor, 1);
  }
  // at the end, save the current streak
  streaks.push(streakLength);

  return streaks;
}
const streakInfo = computed(() => {
  const updateDates = props.project.updates.map(update => update.date).sort();
  const streaks = countStreaks(updateDates);

  const today = formatDate(new Date());
  const yesterday = formatDate(addDays(new Date(), -1));
  const isLastStreakCurrent = (
    updateDates[updateDates.length - 1] === today ||
    updateDates[updateDates.length - 1] === yesterday // it still counts if you haven't updated yet today
  );

  return {
    currentStreak: isLastStreakCurrent ? streaks[streaks.length - 1] : 0,
    longestStreak: Math.max(...streaks),
  };
});

</script>

<template>
  <VaCard>
    <VaCardTitle>Current Streak</VaCardTitle>
    <VaCardContent
      class="text-center text-xl/4"
    >
      {{ streakInfo.currentStreak }} {{ streakInfo.currentStreak === 1 ? 'day' : 'days' }}
    </VaCardContent>
    <VaCardTitle>Longest Streak</VaCardTitle>
    <VaCardContent
      class="text-center text-xl/4"
    >
      {{ streakInfo.longestStreak }} {{ streakInfo.longestStreak === 1 ? 'day' : 'days' }}
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
