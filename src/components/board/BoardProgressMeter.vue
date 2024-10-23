<script setup lang="ts">
import { computed, defineProps } from 'vue';

import { useTheme } from 'src/lib/theme';
import twColors from 'tailwindcss/colors.js';
import themeColors from 'src/themes/primevue.ts';

import type { Board, ParticipantWithTallies } from 'src/lib/api/board.ts';
import { TallyMeasure } from "server/lib/models/tally.ts";

import MeterGroup, { MeterItem } from 'primevue/metergroup';

const props = defineProps<{
  board: Board;
  participants: ParticipantWithTallies[];
  measure: TallyMeasure;
}>();

const contributions = computed(() => {
  const participantContributions = props.participants.map(participant => {
    const tallies = participant.tallies.filter(tally => tally.measure === props.measure);
    const total = tallies.reduce((totalSoFar, tally) => totalSoFar + tally.count, 0);

    return {
      participant,
      total
    };
  })
    .filter(participant => participant.total > 0)
    .sort((a, b) => a.total < b.total ? 1 : a.total > b.total ? -1 : 0);

  return participantContributions;
});

const DEFAULT_LINE_COLORS = {
  text: { light: themeColors.surface[900], dark: themeColors.surface[50] },
  secondaryText: { light: themeColors.surface[300], dark: themeColors.surface[600] },

  cycle: {
    light: [ twColors.red[500], twColors.orange[500], twColors.yellow[500], twColors.green[500], twColors.blue[500], twColors.purple[500] ],
    dark: [ twColors.red[400], twColors.orange[400], twColors.yellow[400], twColors.green[400], twColors.blue[400], twColors.purple[400] ],
  },
};
const colorCycle = computed(() => {
  const preferredColorScheme = useTheme().computedTheme.value;
  return DEFAULT_LINE_COLORS.cycle[preferredColorScheme];
});

const meterValue = computed(() => {
  const value = contributions.value.map((total, ix) => {
    return {
      label: total.participant.displayName,
      value: total.total,
      color: colorCycle.value[ix % colorCycle.value.length],
    } as MeterItem;
  });

  return value;
});

const grandTotal = computed(() => {
  return contributions.value.reduce((totalSoFar, c) => totalSoFar + c.total, 0);
});

const max = computed(() => {
  if(props.measure in props.board.goal) {
    return Math.max(props.board.goal[props.measure], grandTotal.value);
  } else {
    return grandTotal.value;
  }
});

</script>

<template>
  <MeterGroup
    :value="meterValue"
    :max="max"
  />
</template>

<style scoped>
</style>
