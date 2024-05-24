<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

import { useBoardStore } from 'src/stores/board.ts';
const boardStore = useBoardStore();

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import type { MenuItem } from 'primevue/menuitem';

import CreateBoardForm from 'src/components/board/CreateBoardForm.vue';
import Card from 'primevue/card';

const breadcrumbs: MenuItem[] = [
  { label: 'Boards', url: '/boards' },
  { label: 'New Board', url: '/boards/new' },
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
        <SectionTitle title="Create a Board" />
      </template>
      <template #content>
        <CreateBoardForm
          @board:create="boardStore.populate(true)"
          @form-success="router.push('/boards')"
          @form-cancel="router.push('/boards')"
        />
      </template>
    </Card>
  </ApplicationLayout>
</template>

<style scoped>
</style>
