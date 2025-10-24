<script setup lang="ts">
import { ref } from 'vue';
import { useEventBus } from '@vueuse/core';
import { type LeaderboardSummary, starLeaderboard } from 'src/lib/api/leaderboard.ts';

const props = defineProps<{
  leaderboard: LeaderboardSummary;
}>();

const eventBus = useEventBus<{ leaderboard: LeaderboardSummary }>('leaderboard:star');

import Card from 'primevue/card';
import UserAvatarGroup from '../UserAvatarGroup.vue';
import { PrimeIcons } from 'primevue/api';
import { describeLeaderboard } from 'src/lib/board';

const isStarLoading = ref<boolean>(false);
async function onStarClick() {
  isStarLoading.value = true;

  const newStarVal = !props.leaderboard.starred;
  await starLeaderboard(props.leaderboard.uuid, newStarVal);
  isStarLoading.value = false;

  eventBus.emit({ leaderboard: props.leaderboard });
}
</script>

<template>
  <Card
    :pt="{ content: { class: '!py-0' } }"
    :pt-options="{ mergeSections: true, mergeProps: true }"
  >
    <template #title>
      <div class="flex gap-2 items-baseline">
        <span
          :class="[
            isStarLoading ? PrimeIcons.SPINNER + ' pi-spin' : props.leaderboard.starred ? PrimeIcons.STAR_FILL : PrimeIcons.STAR,
            'text-primary-500 dark:text-primary-400'
          ]"
          @click.prevent="onStarClick"
        />
        <div class="flex-auto">
          {{ props.leaderboard.title }}
        </div>
        <div class="font-light italic text-sm text-right">
          {{ describeLeaderboard(props.leaderboard) }}
        </div>
      </div>
    </template>
    <template #content>
      <div class="flex flex-col md:flex-row md:items-end gap-2">
        <div class="font-light italic grow">
          {{ props.leaderboard.description }}
        </div>
        <div>
          <UserAvatarGroup
            :users="props.leaderboard.members.filter(member => member.isParticipant)"
            :limit="5"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
