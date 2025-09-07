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
import InputGroup from 'primevue/inputgroup';
import InputText from 'primevue/inputtext';

import { useToast } from 'primevue/usetoast';
const toast = useToast();

const makeDirectLink = function(leaderboard) {
  return `${envStore.env!.URL_PREFIX}/leaderboards/join?joinCode=${leaderboard.uuid}`;
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
  <div class="flex flex-col gap-4 mb-4">
    <div class="flex flex-col gap-1">
      <div class="text-lg font-bold font-heading">
        Join Code
      </div>
      <div>
        <InputGroup>
          <InputText
            :value="props.leaderboard.uuid"
            read-only
          />
          <Button
            label="Copy"
            :icon="PrimeIcons.COPY"
            severity="help"
            @click="handleCopyCodeClick"
          />
        </InputGroup>
      </div>
    </div>
    <div class="flex flex-col gap-1">
      <div class="text-lg font-bold font-heading">
        Direct Join Link
      </div>
      <div>
        <InputGroup>
          <InputText
            :value="makeDirectLink(props.leaderboard)"
            read-only
          />
          <Button
            label="Copy"
            :icon="PrimeIcons.COPY"
            severity="help"
            @click="handleCopyLinkClick"
          />
        </InputGroup>
      </div>
    </div>
  </div>
</template>
