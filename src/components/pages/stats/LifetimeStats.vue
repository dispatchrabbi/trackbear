<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRouter } from 'vue-router';
const router = useRouter();

import { User } from '@prisma/client';
import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { useGoalStore } from 'src/stores/goal.ts';
const goalStore = useGoalStore();

import { getTallies, Tally } from 'src/lib/api/tally.ts';
import { getGoal, GoalAndTallies } from 'src/lib/api/goal.ts';
import { GOAL_TYPE } from 'server/lib/models/goal.ts';
import { cmpGoal } from 'src/lib/goal.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import UnverifiedEmailMessage from 'src/components/account/UnverifiedEmailMessage.vue';
import ActivityHeatmap from 'src/components/dashboard/ActivityHeatmap.vue';
import StreakCounter from 'src/components/dashboard/StreakCounter.vue';
import HabitGoalStatus from '../dashboard/HabitGoalStatus.vue';
import TargetGoalStatus from '../dashboard/TargetGoalStatus.vue';

const breadcrumbs: MenuItem[] = [
  { label: 'Stats' },
  { label: 'Lifetime', url: '/stats/lifetime' },
];
</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="max-w-screen-lg">
      <SectionTitle title="Lifetime Stats" />
      <p>Many stat! Much wow.</p>
      <p><pre>{{ JSON.stringify(userStore.user.userSettings) }}</pre></p>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
</style>
