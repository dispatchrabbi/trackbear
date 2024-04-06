<script setup lang="ts">
import { ref, onMounted } from 'vue';

import { useRouter } from 'vue-router';
const router = useRouter();

import { User } from '@prisma/client';
import { getMe } from 'src/lib/api/user.ts';

import { getTallies, Tally } from 'src/lib/api/tally.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import UnverifiedEmailMessage from 'src/components/account/UnverifiedEmailMessage.vue';
import ActivityHeatmap from 'src/components/dashboard/ActivityHeatmap.vue';
import StreakCounter from 'src/components/dashboard/StreakCounter.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Dashboard', url: '/dashboard' },
];

const user = ref<User>(null);
async function loadUser() {
  try {
    user.value = await getMe();
  } catch(err) {
    router.push('/logout');
  }
}

const tallies = ref<Tally[]>([]);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const loadTallies = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    tallies.value = await getTallies();
  } catch(err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadUser();
  loadTallies();
});
</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="max-w-screen-lg">
      <div
        v-if="user && !user.isEmailVerified"
        class="m-2"
      >
        <UnverifiedEmailMessage />
      </div>
      <div class="">
        <SectionTitle title="Activity" />
        <ActivityHeatmap
          :tallies="tallies"
        />
      </div>
      <div class="mt-4">
        <SectionTitle title="Streaks" />
        <StreakCounter
          :tallies="tallies"
        />
      </div>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
