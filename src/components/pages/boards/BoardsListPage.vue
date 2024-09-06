<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
const router = useRouter();

import { useBoardStore } from 'src/stores/board.ts';
import { cmpBoard } from 'src/lib/board.ts';
const boardStore = useBoardStore();

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

import BoardTile from 'src/components/board/BoardTile.vue';
import JoinCodeForm from 'src/components/board/JoinCodeForm.vue';
import { PrimeIcons } from 'primevue/api';

const breadcrumbs: MenuItem[] = [
  { label: 'Leaderboards', url: '/leaderboards' },
];

const isJoinFormVisible = ref<boolean>(false);

const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const loadBoards = async function(force = false) {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    await boardStore.populate(force);
  } catch(err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

const reloadBoards = async function() {
  loadBoards(true);
}

const boards = computed(() => {
  return boardStore.boards === null ? [] : boardStore.boards;
})

const boardsFilter = ref<string>('');
const filteredBoards = computed(() => {
  const sortedGoals = boards.value.toSorted(cmpBoard);
  const searchTerm = boardsFilter.value.toLowerCase();
  return sortedGoals.filter(board => board.title.toLowerCase().includes(searchTerm) || board.description.toLowerCase().includes(searchTerm));
});

onMounted(() => {
  loadBoards();
});

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="actions flex flex-row-reverse flex-wrap justify-start gap-2 mb-4">
      <div class="flex flex-wrap gap-2">
        <div>
          <Button
            label="Use Join Code"
            severity="help"
            :icon="PrimeIcons.USER_PLUS"
            @click="isJoinFormVisible = true"
          />
        </div>
        <div>
          <RouterLink :to="{ name: 'new-board' }">
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
            v-model="boardsFilter"
            class="w-full"
            placeholder="Type to filter..."
          />
        </IconField>
      </div>
    </div>
    <div
      v-for="board in filteredBoards"
      :key="board.id"
      class="mb-2"
    >
      <RouterLink :to="{ name: 'board', params: { boardUuid: board.uuid } }">
        <BoardTile
          :board="board"
          @board:star="reloadBoards()"
        />
      </RouterLink>
    </div>
    <div v-if="filteredBoards.length === 0 && boards.length > 0">
      No matching leaderboards found.
    </div>
    <div v-if="boards.length === 0">
      You haven't made any leaderboards yet. Click the <span class="font-bold">New</span> button to get started!
    </div>
    <Dialog
      v-model:visible="isJoinFormVisible"
      modal
    >
      <template #header>
        <h2 class="font-heading font-semibold uppercase">
          <span :class="PrimeIcons.USER_PLUS" />
          Use Join Code
        </h2>
      </template>
      <JoinCodeForm
        @code:confirm="({code}) => router.push({ name: 'join-board', params: { uuid: code }})"
        @form-success="isJoinFormVisible = false"
      />
    </Dialog>
  </ApplicationLayout>
</template>
