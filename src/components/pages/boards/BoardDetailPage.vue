<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus, useClipboard } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useBoardStore } from 'src/stores/board.ts';
const boardStore = useBoardStore();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { getBoard, FullBoard } from 'src/lib/api/board.ts';
import { Tally } from 'src/lib/api/tally.ts';

import { toTitleCase } from 'src/lib/str.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Button from 'primevue/button';
import UserAvatar from 'src/components/UserAvatar.vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Dialog from 'primevue/dialog';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import SubsectionTitle from 'src/components/layout/SubsectionTitle.vue';
import BoardLineChart from 'src/components/board/BoardLineChart.vue';
import BoardStandings from 'src/components/board/BoardStandings.vue';
import LeaveBoardForm from 'src/components/board/LeaveBoardForm.vue';
import DeleteBoardForm from 'src/components/board/DeleteBoardForm.vue';

import { useToast } from 'primevue/usetoast';
const toast = useToast();

const boardUuid = ref<string>(route.params.uuid.toString());
watch(() => route.params.uuid, newUuid => {
  if(newUuid !== undefined) {
    boardUuid.value = newUuid.toString();
    reloadBoards(); // this isn't a great pattern - it should get changed
  }
});

const board = ref<FullBoard | null>(null);

const ownerIsViewing = computed(() => {
  if(board.value === null) {
    return false;
  } else {
    return board.value.ownerId === userStore.user.id;
  }
});

const measuresAvailable = computed(() => {
  if(board.value === null) { return [ TALLY_MEASURE.WORD ]; }

  const measuresPresent = new Set(board.value.participants.flatMap(participant => participant.tallies.map(tally => tally.measure)));
  return Object.keys(TALLY_MEASURE_INFO).filter(measure => measuresPresent.has(measure));
});

const selectedMeasure = ref(TALLY_MEASURE.WORD);
watch(measuresAvailable, (newMeasuresAvailable) => {
  if(!newMeasuresAvailable.includes(selectedMeasure.value)) {
    selectedMeasure.value = measuresAvailable.value[0];
  }
});

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Boards', url: '/boards' },
    { label: board.value === null ? 'Loading...' : board.value.title, url: `/goals/${boardUuid.value}` },
  ];
  return crumbs;
});

const { copy } = useClipboard({ legacy: true });
const handleShareClick = function() {
  copy(document.location.href);
  toast.add({
    severity: 'info',
    summary: 'Link copied!',
    detail: 'This link to this board has been copied to your clipboard.',
    life: 3 * 1000,
  });
};

const isLeaveFormVisible = ref<boolean>(false);
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
    if(err.code === 'MUST_JOIN') {
      router.push({ name: 'join-board', params: { uuid: boardUuid.value } });
    } else if(err.code !== 'NOT_LOGGED_IN') {
      // the ApplicationLayout takes care of this. Otherwise, this will redirect to /boards before ApplicationLayout can redirect to /login.
      // TODO: figure out a better way to ensure that there's no race condition here
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
          >
            <template #action>
              <Button
                v-if="board.isPublic || board.isPublic"
                :icon="PrimeIcons.SHARE_ALT"
                size="small"
                rounded
                text
                @click="handleShareClick"
              />
            </template>
          </SectionTitle>
          <div class="spacer grow" />
          <div class="flex gap-2 flex-col md:flex-row">
            <Button
              v-if="ownerIsViewing"
              label="Configure Board"
              :icon="PrimeIcons.COG"
              @click="router.push({ name: 'edit-board', params: { uuid: board.uuid } })"
            />
            <Button
              v-if="ownerIsViewing"
              severity="danger"
              label="Delete Board"
              :icon="PrimeIcons.TRASH"
              @click="isDeleteFormVisible = true"
            />
          </div>
        </div>
      </header>
      <div
        class="flex flex-row-reverse flex-wrap justify-end gap-8"
      >
        <div class="max-w-screen-md">
          <SubsectionTitle title="Participants" />
          <div
            v-if="board.participants.length > 0"
            class="mb-4 flex flex-wrap gap-2"
          >
            <UserAvatar
              v-for="participant of board.participants"
              :key="participant.uuid"
              :user="participant"
            />
          </div>
          <div v-else-if="!board.isJoinable">
            <p>This board is closed to joining.</p>
            <p v-if="ownerIsViewing">
              Click "Configure Board" to open the board so people can join.
            </p>
          </div>
          <div class="flex gap-2 flex-row">
            <Button
              v-if="board.isJoinable && !board.participants.some(p => p.uuid === userStore.user.uuid)"
              size="small"
              label="Join Board"
              :icon="PrimeIcons.USER_PLUS"
              @click="router.push({ name: 'join-board', params: { uuid: board.uuid } })"
            />
            <Button
              v-if="board.participants.some(p => p.uuid === userStore.user.uuid)"
              size="small"
              label="Edit Filters"
              :icon="PrimeIcons.USER_EDIT"
              @click="router.push({ name: 'join-board', params: { uuid: board.uuid } })"
            />
            <Button
              v-if="board.participants.some(p => p.uuid === userStore.user.uuid)"
              severity="danger"
              size="small"
              label="Leave Board"
              :icon="PrimeIcons.USER_MINUS"
              @click="isLeaveFormVisible = true"
            />
          </div>
        </div>
        <div
          class="w-full max-w-screen-md"
        >
          <SubsectionTitle title="Standings" />
          <div v-if="board.participants.length > 0">
            <TabView
              :pt="{ tabpanel: { content: { class: [ 'px-0' ] } } }"
              :pt-options="{ mergeSections: true, mergeProps: true }"
              @update:active-index="index => selectedMeasure = measuresAvailable[index]"
            >
              <TabPanel
                v-for="measure of board.measures"
                :key="measure"
                :header="toTitleCase(TALLY_MEASURE_INFO[measure].label.plural)"
              >
                <!-- line chart -->
                <div class="w-full">
                  <BoardLineChart
                    :board="board"
                    :participants="board.participants"
                    :measure="selectedMeasure"
                  />
                </div>
                <!-- stats table -->
                <div class="w-full mt-4">
                  <BoardStandings
                    :board="board"
                    :participants="board.participants"
                    :measure="selectedMeasure"
                  />
                </div>
              </TabPanel>
            </TabView>
          </div>
          <div v-else>
            This board has no participants, so there's nothing to show.
          </div>
        </div>
      </div>
      <Dialog
        v-model:visible="isLeaveFormVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.USER_MINUS" />
            Leave Board
          </h2>
        </template>
        <LeaveBoardForm
          :board="board"
          @board:leave="boardStore.populate(true)"
          @form-success="router.push({ name: 'boards' })"
        />
      </Dialog>
      <Dialog
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
          @form-success="router.push({ name: 'boards' })"
        />
      </Dialog>
    </div>
  </ApplicationLayout>
</template>
