<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

import type { Goal } from 'server/api/v1/goal';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import type { MenuItem } from 'primevue/menuitem';

import CreateGoalForm from 'src/components/goal/CreateGoalForm.vue';
import Card from 'primevue/card';

const breadcrumbs: MenuItem[] = [
  { label: 'Goals', url: '/goals' },
  { label: 'New Goal', url: '/goals/new' },
];

function handleFormSuccess({ goal }: { goal: Goal }) {
  router.push({ name: 'goal', params: { goalId: goal.id } });
}

function handleFormFailure() {
  router.push({ name: 'goals' });
}

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <Card
      class="max-w-screen-md"
    >
      <template #title>
        <SectionTitle title="Create a Goal" />
      </template>
      <template #content>
        <CreateGoalForm
          @form-success="handleFormSuccess"
          @form-cancel="handleFormFailure"
        />
      </template>
    </Card>
  </ApplicationLayout>
</template>

<style scoped>
</style>
