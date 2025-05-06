<script setup lang="ts">
import { onMounted } from 'vue';
import { useClipboard } from '@vueuse/core';
const { copy } = useClipboard({ legacy: true });

import { useEnvStore } from 'src/stores/env';
const envStore = useEnvStore();

import { type Leaderboard } from 'src/lib/api/leaderboard.ts';

const props = defineProps<{
  leaderboard: Leaderboard;
}>();

import { PrimeIcons } from 'primevue/api';
import Button from 'primevue/button';
import Divider from 'primevue/divider';

import SubsectionTitle from '../layout/SubsectionTitle.vue';

import { useToast } from 'primevue/usetoast';
const toast = useToast();

const makeDirectLink = function(leaderboard) {
  return `${envStore.env.URL_PREFIX}/leaderboards/join?joinCode=${leaderboard.uuid}`;
};

const handleCopyCodeClick = function() {
  copy(props.leaderboard.uuid);
  toast.add({
    severity: 'success',
    summary: 'Code copied!',
    detail: 'The join code for this leaderboard has been copied to your clipboard.',
    life: 3 * 1000,
  });
};

const handleCopyLinkClick = function() {
  copy(makeDirectLink(props.leaderboard));
  toast.add({
    severity: 'success',
    summary: 'Link copied!',
    detail: 'The join link for this leaderboard has been copied to your clipboard.',
    life: 3 * 1000,
  });
};

onMounted(async () => {
  await envStore.populate();
});
</script>

<template>
  <div class="flex flex-col gap-2 mb-4">
    <div class="flex flex-col gap-1">
      <div class="flex justify-start items-baseline gap-2 mt-1">
        <div class="text-lg font-bold font-heading">
          Join Code
        </div>
        <!-- <SubsectionTitle title="Join Code" /> -->
        <Button
          label="Copy"
          :icon="PrimeIcons.COPY"
          size="small"
          severity="help"
          @click="handleCopyCodeClick"
        />
      </div>
      <div class="text-xl">
        {{ props.leaderboard.uuid }}
      </div>
    </div>
    <Divider />
    <div class="flex flex-col gap-1">
      <div class="flex justify-start items-baseline gap-2 mt-1">
        <SubsectionTitle title="Direct Join Link" />
        <Button
          label="Copy"
          :icon="PrimeIcons.COPY"
          size="small"
          severity="help"
          @click="handleCopyLinkClick"
        />
      </div>
      <div class="text-xl">
        {{ makeDirectLink(props.leaderboard) }}
      </div>
    </div>
  </div>
</template>
