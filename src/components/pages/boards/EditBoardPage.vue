<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

// import { useBoardStore } from 'src/stores/board.ts';
// const boardStore = useBoardStore();

import { getBoard, Board } from 'src/lib/api/board.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import type { MenuItem } from 'primevue/menuitem';

import EditBoardForm from 'src/components/board/EditBoardForm.vue';
import Card from 'primevue/card';

const boardUuid = ref<string>(route.params.boardUuid.toString());
watch(() => route.params.boardUuid, newUuid => {
  if(newUuid !== undefined) {
    boardUuid.value = newUuid.toString();
    loadBoard();
  }
});

const board = ref<Board | null>(null);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const loadBoard = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const result = await getBoard(boardUuid.value);
    board.value = result;
  } catch(err) {
    errorMessage.value = err.message;
    router.push('/leaderboards');
  } finally {
    isLoading.value = false;
  }
}

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Leaderboards', url: '/leaderboards' },
    { label: board.value === null ? 'Loading...' : board.value.title, url: `/leaderboards/${boardUuid.value}` },
    { label: board.value === null ? 'Loading...' : 'Edit', url: `/leaderboards/${boardUuid.value}/edit` },
    ];
  return crumbs;
});


onMounted(() => loadBoard());

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <Card
      v-if="board !== null"
      class="max-w-screen-md"
    >
      <template #title>
        <SectionTitle :title="`Edit ${board.title}`" />
      </template>
      <template #content>
        <EditBoardForm
          :board="board"
          @form-success="router.push(`/leaderboards/${board.uuid}`)"
          @form-cancel="router.push(`/leaderboards/${board.uuid}`)"
        />
      </template>
    </Card>
  </ApplicationLayout>
</template>

<style scoped>
</style>
