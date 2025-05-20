<script setup lang="ts">
import { ref, computed } from 'vue';

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { type Leaderboard } from 'src/lib/api/leaderboard';

import type { MenuItem } from 'primevue/menuitem';
import Stepper from 'primevue/stepper';
import StepperPanel from 'primevue/stepperpanel';
import Panel from 'primevue/panel';

import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import JoinCodeForm from 'src/components/leaderboard/JoinCodeForm.vue';
import JoinLeaderboardParticipationForm from 'src/components/leaderboard/JoinLeaderboardParticipationForm.vue';

const leaderboard = ref<Leaderboard>(null);

const handleJoinCodeConfirmation = function(leaderboardToJoin: Leaderboard) {
  leaderboard.value = leaderboardToJoin;
};

const queryJoinCode = computed(() => {
  return (route.query['joinCode'] ?? '').toString();
});

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Leaderboards', url: '/leaderboards' },
    { label: leaderboard.value === null ? 'Join a leaderboard' : `Join ${leaderboard.value.title}`, url: `/leaderboards/join` },
  ];
  return crumbs;
});

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <Stepper
      orientation="vertical"
      linear
      class="max-w-screen-md"
    >
      <StepperPanel header="Enter Join Code">
        <template #content="{ nextCallback }">
          <JoinCodeForm
            :prepopulated-join-code="queryJoinCode"
            @code:confirm="({ leaderboard }) => handleJoinCodeConfirmation(leaderboard)"
            @form-success="nextCallback"
          />
        </template>
      </StepperPanel>
      <StepperPanel header="Set Your Participation">
        <template #content="{ prevCallback }">
          <Panel header="Participation Settings">
            <JoinLeaderboardParticipationForm
              v-if="leaderboard"
              :leaderboard="leaderboard"
              @form-success="router.push({ name: 'leaderboard', params: { boardUuid: leaderboard.uuid } })"
              @form-cancel="prevCallback"
            />
          </Panel>
        </template>
      </StepperPanel>
    </Stepper>
  </ApplicationLayout>
</template>

<style scoped>
</style>
