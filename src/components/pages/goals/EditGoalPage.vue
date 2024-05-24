<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useGoalStore } from 'src/stores/goal.ts';
const goalStore = useGoalStore();

import { getGoal, GoalWithWorksAndTags } from 'src/lib/api/goal.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import type { MenuItem } from 'primevue/menuitem';

import EditGoalForm from 'src/components/goal/EditGoalForm.vue';
import Card from 'primevue/card';

const goalId = ref<number>(+route.params.id);
watch(() => route.params.id, newId => {
  if(newId !== undefined) {
    goalId.value = +newId;
    loadGoal();
  }
});

const goal = ref<GoalWithWorksAndTags | null>(null);

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Goals', url: '/goals' },
    { label: goal.value === null ? 'Loading...' : goal.value.title, url: `/goals/${goalId.value}` },
    { label: goal.value === null ? 'Loading...' : 'Edit', url: `/goals/${goalId.value}/edit` },
  ];
  return crumbs;
});

const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const loadGoal = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const result = await getGoal(+goalId.value);
    goal.value = result.goal;
  } catch(err) {
    errorMessage.value = err.message;
    router.push('/goals');
  } finally {
    isLoading.value = false;
  }
}

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
          :goal="goal"
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
