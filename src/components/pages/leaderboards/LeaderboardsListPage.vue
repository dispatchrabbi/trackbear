<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import { useLeaderboardStore } from 'src/stores/leaderboard.ts';
const leaderboardStore = useLeaderboardStore();

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';

import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

import LeaderboardTile from 'src/components/leaderboard/LeaderboardTile.vue';
import { PrimeIcons } from 'primevue/api';

const breadcrumbs: MenuItem[] = [
  { label: 'Leaderboards', url: '/leaderboards' },
];

const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const loadLeaderboards = async function(force = false) {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    await leaderboardStore.populate(force);
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const filter = ref<string>('');
const filteredLeaderboards = computed(() => {
  // TODO: create a sort dropdown and sort by that here
  const sortedLeaderboards = leaderboardStore.allLeaderboards;
  const searchTerm = filter.value.toLowerCase();
  return sortedLeaderboards.filter(leaderboard => leaderboard.title.toLowerCase().includes(searchTerm) || leaderboard.description.toLowerCase().includes(searchTerm));
});

onMounted(async () => {
  await loadLeaderboards();
});

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="actions flex flex-row-reverse flex-wrap justify-start gap-2 mb-4">
      <div class="flex flex-wrap gap-2">
        <div>
          <RouterLink :to="{ name: 'join-leaderboard' }">
            <Button
              label="Use Join Code"
              severity="help"
              :icon="PrimeIcons.USER_PLUS"
            />
          </RouterLink>
        </div>
        <div>
          <RouterLink :to="{ name: 'new-leaderboard' }">
            <Button
              label="New"
              :icon="PrimeIcons.PLUS"
            />
          </RouterLink>
        </div>
      </div>
      <div>
        <IconField>
          <InputIcon>
            <span :class="PrimeIcons.SEARCH" />
          </InputIcon>
          <InputText
            v-model="filter"
            class="w-full"
            placeholder="Type to filter..."
          />
        </IconField>
      </div>
    </div>
    <div v-if="isLoading">
      Loading leaderboards...
    </div>
    <div v-else-if="leaderboardStore.allLeaderboards.length === 0">
      You haven't made any leaderboards yet. Click the <span class="font-bold">New</span> button to get started!
    </div>
    <div v-else-if="filteredLeaderboards.length === 0">
      No matching leaderboards found.
    </div>
    <div
      v-for="leaderboard in filteredLeaderboards"
      v-else
      :key="leaderboard.uuid"
      class="mb-2"
    >
      <RouterLink :to="{ name: 'leaderboard', params: { boardUuid: leaderboard.uuid } }">
        <LeaderboardTile
          :leaderboard="leaderboard"
        />
      </RouterLink>
    </div>
  </ApplicationLayout>
</template>
