<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useGoalStore } from 'src/stores/goal.ts';
const goalStore = useGoalStore();

import type { Goal } from 'src/lib/api/goal.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import type { MenuItem } from 'primevue/menuitem';

import EditGoalForm from 'src/components/goal/EditGoalForm.vue';
import Card from 'primevue/card';

const goalId = ref<number>(+route.params.goalId);
watch(() => route.params.goalId, newId => {
  if(newId !== undefined) {
    goalId.value = +newId;
    loadGoal();
  }
});

const goal = ref<Goal | null>(null);
  const isGoalLoading = ref<boolean>(false);
const goalErrorMessage = ref<string | null>(null);
const loadGoal = async function() {
  isGoalLoading.value = true;
  goalErrorMessage.value = null;

  try {
    await goalStore.populate();
    goal.value = goalStore.get(+goalId.value);
  } catch(err) {
    goalErrorMessage.value = err.message;
    // the ApplicationLayout takes care of this. Otherwise, this will redirect to /goals before ApplicationLayout
    // can redirect to /login.
    // TODO: figure out a better way to ensure that there's no race condition here
    if(err.code !== 'NOT_LOGGED_IN') {
      router.push({ name: 'goals' });
    }
  } finally {
    isGoalLoading.value = false;
  }
}

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Goals', url: '/goals' },
    { label: goal.value === null ? 'Loading...' : goal.value.title, url: `/goals/${goalId.value}` },
    { label: goal.value === null ? 'Loading...' : 'Edit', url: `/goals/${goalId.value}/edit` },
  ];
  return crumbs;
});

onMounted(() => loadGoal());

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <Card
      v-if="goal !== null"
      class="max-w-screen-md"
    >
      <template #title>
        <SectionTitle :title="`Edit ${goal.title}`" />
      </template>
      <template #content>
        <EditGoalForm
          :goal="goal as Goal"
          @goal:edit="goalStore.populate(true)"
          @form-success="router.push(`/goals/${goal.id}`)"
          @form-cancel="router.push(`/goals/${goal.id}`)"
        />
      </template>
    </Card>
  </ApplicationLayout>
</template>

<style scoped>
</style>
