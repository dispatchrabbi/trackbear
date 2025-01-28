<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

// import { useGoalStore } from 'src/stores/goal.ts';
// const goalStore = useGoalStore();

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import type { MenuItem } from 'primevue/menuitem';

import CreateGoalForm from 'src/components/goal/CreateGoalForm.vue';
import Card from 'primevue/card';

const breadcrumbs: MenuItem[] = [
  { label: 'Goals', url: '/goals' },
  { label: 'New Goal', url: '/goals/new' },
];

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
          @form-success="router.push('/goals')"
          @form-cancel="router.push('/goals')"
        />
      </template>
    </Card>
  </ApplicationLayout>
</template>

<style scoped>
</style>
