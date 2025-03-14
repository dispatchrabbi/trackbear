<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

// import { useBoardStore } from 'src/stores/board.ts';
// const boardStore = useBoardStore();

import { getBoardParticipation, BoardWithParticipants } from 'src/lib/api/board.ts';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import type { MenuItem } from 'primevue/menuitem';

import EditBoardParticipationForm from 'src/components/board/EditBoardParticipationForm.vue';
import Card from 'primevue/card';

const boardUuid = ref<string>(route.params.boardUuid.toString());
watch(() => route.params.boardUuid, newUuid => {
  if(newUuid !== undefined) {
    boardUuid.value = newUuid.toString();
    loadBoardParticipation();
  }
});

const board = ref<BoardWithParticipants | null>(null);

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Leaderboards', url: '/leaderboards' },
    { label: board.value === null ? 'Loading...' : board.value.title, url: `/leaderboards/${boardUuid.value}` },
    { label: board.value === null ? 'Loading...' : 'Join', url: `/leaderboards/${boardUuid.value}/join` },
    ];
  return crumbs;
});

const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const loadBoardParticipation = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const result = await getBoardParticipation(boardUuid.value);
    board.value = result;
  } catch(err) {
    errorMessage.value = err.message;
    router.push({ name: 'boards' });
  } finally {
    isLoading.value = false;
  }
}

const isNewParticipant = computed(() => {
  return board.value && board.value.participants.length === 0;
});

onMounted(async () => {
  await loadBoardParticipation();
  if(!isNewParticipant.value) {
    router.push({ name: 'board', params: { boardUuid: boardUuid.value } });
  }
});

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
        <SectionTitle
          :title="`Join ${board.title}`"
        />
      </template>
      <template #content>
        <div v-if="board.isJoinable">
          <EditBoardParticipationForm
            :board="board"
            :participant="board.participants[0] ?? null"
            @form-success="router.push({ name: 'board', params: { boardUuid: board.uuid } })"
            @form-cancel="board.isPublic ? router.push({ name: 'board', params: { boardUuid: board.uuid } }) : router.push({ name: 'boards' })"
          />
        </div>
        <div v-else>
          <div class="mb-4">
            Sorry, but this leaderboard is not open to new participants. If you are trying to join this leaderboard, please talk to the leaderboard owner.
          </div>
        </div>
      </template>
    </Card>
  </ApplicationLayout>
</template>

<style scoped>
</style>
