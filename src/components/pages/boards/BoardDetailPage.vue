<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useBoardStore } from 'src/stores/board.ts';
const boardStore = useBoardStore();

import { getBoard, FullBoard } from 'src/lib/api/board.ts';
import { Tally } from 'src/lib/api/tally.ts';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
// import TargetStats from 'src/components/goal/TargetStats.vue';
// import TargetLineChart from 'src/components/goal/TargetLineChart.vue';
// import HabitStats from 'src/components/goal/HabitStats.vue';
// import HabitHistory from 'src/components/goal/HabitHistory.vue';
// import DeleteBoardForm from 'src/components/goal/DeleteGoalForm.vue';

const boardUuid = ref<string>(route.params.uuid.toString());
watch(() => route.params.uuid, newUuid => {
  if(newUuid !== undefined) {
    boardUuid.value = newUuid.toString();
    reloadBoards(); // this isn't a great pattern - it should get changed
  }
});

const board = ref<FullBoard | null>(null);

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Boards', url: '/boards' },
    { label: board.value === null ? 'Loading...' : board.value.title, url: `/goals/${boardUuid.value}` },
  ];
  return crumbs;
});

const isDeleteFormVisible = ref<boolean>(false);

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
    // the ApplicationLayout takes care of this. Otherwise, this will redirect to /works before ApplicationLayout
    // can redirect to /login.
    // TODO: figure out a better way to ensure that there's no race condition here
    if(err.code !== 'NOT_LOGGED_IN') {
      router.push({ name: 'boards' });
    }
  } finally {
    isLoading.value = false;
  }
}

const reloadBoards = async function() {
  boardStore.populate(true);
  loadBoard();
}

onMounted(() => {
  useEventBus<{ tally: Tally }>('tally:create').on(reloadBoards);
  useEventBus<{ tally: Tally }>('tally:edit').on(reloadBoards);
  useEventBus<{ tally: Tally }>('tally:delete').on(reloadBoards);

  loadBoard();
});
</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div v-if="board">
      <header class="mb-4">
        <div class="actions flex gap-2 items-start">
          <SectionTitle
            :title="board.title"
            :subtitle="board.description"
          />
          <div class="spacer grow" />
          <div class="flex flex-col md:flex-row gap-2">
            <!-- <Button
              label="Edit"
              :icon="PrimeIcons.PENCIL"
              @click="router.push({ name: 'edit-board', params: { id: board.id } })"
            /> -->
            <Button
              severity="danger"
              label="Delete"
              :icon="PrimeIcons.TRASH"
              @click="isDeleteFormVisible = true"
            />
          </div>
        </div>
      </header>
      <div
        :class="[
          'flex flex-col gap-2',
        ]"
      >
        {{ board.uuid }}
      </div>
      <!-- <Dialog
        v-model:visible="isDeleteFormVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.TRASH" />
            Delete Board
          </h2>
        </template>
        <DeleteBoardForm
          :board="board"
          @board:delete="boardStore.populate(true)"
          @form-success="router.push('/boards')"
        />
      </Dialog> -->
    </div>
  </ApplicationLayout>
</template>
