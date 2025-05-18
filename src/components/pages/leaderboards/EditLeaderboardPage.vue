<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { useUserStore } from 'src/stores/user';
const userStore = useUserStore();

import { useLeaderboardStore } from 'src/stores/leaderboard';
const leaderboardStore = useLeaderboardStore();

import { type Participation, type LeaderboardSummary, type Leaderboard, getMyParticipation, deleteLeaderboard, leaveLeaderboard } from 'src/lib/api/leaderboard';

import EditLeaderboardForm from 'src/components/leaderboard/EditLeaderboardForm.vue';
import MembersList from 'src/components/leaderboard/MembersList.vue';
import EditLeaderboardParticipationForm from 'src/components/leaderboard/EditLeaderboardParticipationForm.vue';
import DangerPanel from 'src/components/layout/DangerPanel.vue';
import DangerButton from 'src/components/shared/DangerButton.vue';

import { PrimeIcons } from 'primevue/api';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Panel from 'primevue/panel';

const deleteEventBus = useEventBus<{ leaderboard: Leaderboard }>('leaderboard:delete');
const leaveEventBus = useEventBus<{ leaderboardUuid: string }>('leaderboard:leave');

const leaderboard = ref<LeaderboardSummary>(null);
const isCurrentUserAnOwner = ref<boolean>(false);
const isCurrentUserTheOnlyOwner = ref<boolean>(false);
const loadLeaderboard = async function() {
  leaderboard.value = leaderboardStore.get(route.params.boardUuid.toString());
  if(leaderboard.value === null) {
    router.push({ name: 'leaderboards' });
  }

  const currentMember = leaderboard.value.members.find(member => member.userUuid === userStore.user.uuid);
  if(!currentMember) {
    router.push({ name: 'leaderboards' });
  }
  isCurrentUserAnOwner.value = currentMember.isOwner;

  const owners = leaderboard.value.members.filter(member => member.isOwner);
  isCurrentUserTheOnlyOwner.value = currentMember.isOwner && owners.length === 1;
};

const myParticipation = ref<Participation>(null);
const loadMyParticipation = async function() {
  try {
    myParticipation.value = await getMyParticipation(leaderboard.value.uuid);
  } catch (err) {
    if(err.code !== 'NOT_LOGGED_IN') {
      // the ApplicationLayout takes care of this. If we don't exclude NOT_LOGGED_IN, this will redirect to /leaderboards
      // before ApplicationLayout can redirect to /login.
      // TODO: figure out a better way to ensure that there's no race condition here
      router.push({ name: 'leaderboards' });
    }
  }
};

const isLoading = ref<boolean>(false);
async function reloadData() {
  isLoading.value = true;

  await leaderboardStore.populate(true);
  await loadLeaderboard();
  await loadMyParticipation();

  isLoading.value = false;
}

const handleDeleteLeaderboardSubmit = async function() {
  const deletedLeaderboard = await deleteLeaderboard(leaderboard.value.uuid);
  deleteEventBus.emit({ leaderboard: deletedLeaderboard });
};

const handleLeaveLeaderboardSubmit = async function() {
  await leaveLeaderboard(leaderboard.value.uuid);
  leaveEventBus.emit({ leaderboardUuid: leaderboard.value.uuid });
};

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Leaderboards', url: '/leaderboards' },
    { label: leaderboard.value === null ? 'Loading...' : leaderboard.value.title, url: leaderboard.value === null ? '' : `/leaderboards/${leaderboard.value.uuid}` },
    { label: 'Edit', url: leaderboard.value === null ? '' : `/leaderboards/${leaderboard.value.uuid}/edit` },
  ];
  return crumbs;
});

onMounted(() => {
  reloadData();
});

watch(() => route.params.boardUuid, newUuid => {
  if(newUuid !== undefined) {
    reloadData();
  }
});

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div v-if="isLoading">
      Loading...
    </div>
    <div
      v-else-if="leaderboard !== null"
    >
      <TabView>
        <TabPanel
          v-if="isCurrentUserAnOwner"
          key="leaderboard"
          header="Leaderboard"
        >
          <div class="flex flex-col gap-4 max-w-screen-md">
            <Panel header="Configure Leaderboard">
              <EditLeaderboardForm
                :leaderboard="leaderboard"
                @form-success="router.push({ name: 'leaderboard', params: { boardUuid: route.params.boardUuid }})"
                @form-cancel="router.push({ name: 'leaderboard', params: { boardUuid: route.params.boardUuid }})"
              />
            </Panel>
            <DangerPanel header="Delete this Leaderboard">
              <DangerButton
                label="Delete this leaderboard"
                :icon="PrimeIcons.TRASH"
                action-description="delete this leaderboard"
                action-command="Delete"
                action-in-progress-message="Deleting..."
                action-success-message="This leaderboard has been deleted."
                :confirmation-code="leaderboard.title"
                confirmation-code-description="this leaderboard's title"
                :action-fn="handleDeleteLeaderboardSubmit"
                @inner-form-success="router.push({ name: 'leaderboards' })"
              />
            </DangerPanel>
          </div>
        </TabPanel>
        <TabPanel
          v-if="isCurrentUserAnOwner"
          key="members"
          header="Members"
        >
          <MembersList :leaderboard="leaderboard" />
        </TabPanel>
        <TabPanel
          key="participation"
          header="My Participation"
        >
          <div class="flex flex-col gap-4 max-w-screen-md">
            <Panel header="What to Include">
              <EditLeaderboardParticipationForm
                :leaderboard="leaderboard"
                :participation="myParticipation"
                @form-success="router.push({ name: 'leaderboard', params: { boardUuid: route.params.boardUuid }})"
                @form-cancel="router.push({ name: 'leaderboard', params: { boardUuid: route.params.boardUuid }})"
              />
            </Panel>
            <DangerPanel header="Leave this Leaderboard">
              <div v-if="isCurrentUserTheOnlyOwner">
                <!-- You cannot leave this leaderboard because you are its only owner. To be able to leave the leaderboard,
                you must first promote at least one other member to be an owner in your stead on the Members tab. -->
                You cannot leave this leaderboard because you are its only owner.
              </div>
              <DangerButton
                v-else
                label="Leave this leaderboard"
                :icon="PrimeIcons.USER_MINUS"
                action-description="leave this leaderboard"
                action-command="Leave"
                action-in-progress-message="Leaving..."
                action-success-message="You have left the leaderboard."
                :confirmation-code="leaderboard.title"
                confirmation-code-description="this leaderboard's title"
                :action-fn="handleLeaveLeaderboardSubmit"
                @inner-form-success="router.push({ name: 'leaderboards' })"
              />
            </DangerPanel>
          </div>
        </TabPanel>
      </TabView>
    </div>
  </ApplicationLayout>
</template>
