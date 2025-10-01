<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEventBus } from '@vueuse/core';

import { useAsyncSignals, defaultOnError } from 'src/lib/use-async-signals';

import { type LeaderboardSummary, type Membership, type Leaderboard, listMembers, updateMember, removeMember } from 'src/lib/api/leaderboard';
import { cmpMember } from 'src/lib/board';

import { PrimeIcons } from 'primevue/api';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

import UserAvatar from '../../UserAvatar.vue';
import MemberTeamForm from './MemberTeamForm.vue';
import DangerButton from 'src/components/shared/DangerButton.vue';

const props = defineProps<{
  leaderboard: LeaderboardSummary;
}>();

const memberUpdateEventBus = useEventBus<{ leaderboard: Leaderboard; member: Membership }>('member:update');
const memberRemoveEventBus = useEventBus<{ leaderboard: Leaderboard; member: Membership }>('member:remove');

function describeMemberRole(member: Membership) {
  return member.isOwner ? 'Owner' : member.isParticipant ? 'Participant' : 'Spectator';
}

function getMemberRoleTagSeverity(member: Membership) {
  return member.isOwner ? 'primary' : member.isParticipant ? 'success' : 'secondary';
}

const members = ref<Membership[] | null>(null);
const [loadMembers, signals] = useAsyncSignals(async function() {
  const result = await listMembers(props.leaderboard.uuid);
  members.value = result.sort(cmpMember);
});

const onlyOwnerUuid = computed(() => {
  if(members.value === null) {
    return null;
  }

  const owners = members.value.filter(member => member.isOwner);
  return owners.length === 1 ? owners[0].uuid : null;
});

const [updateIsOwner, updateMemberSignals] = useAsyncSignals(async function(member: Membership, willBeOwner: boolean) {
  const updated = await updateMember(props.leaderboard.uuid, member.id, { isOwner: willBeOwner });
  memberUpdateEventBus.emit({ leaderboard: props.leaderboard, member: updated });
  return updated;
}, defaultOnError, async () => { await loadMembers(); return null; });

const [kickMember, kickMemberSignals] = useAsyncSignals(async function(member: Membership) {
  const removed = await removeMember(props.leaderboard.uuid, member.id);
  memberRemoveEventBus.emit({ leaderboard: props.leaderboard, member: removed });
  return removed;
}, defaultOnError, async () => { await loadMembers(); return null; });

const isActionLoading = computed(() => {
  return updateMemberSignals.isLoading || kickMemberSignals.isLoading;
});

function handleMemberTeamChange(newTeamId: number | null, member: Membership) {
  memberUpdateEventBus.emit({ leaderboard: props.leaderboard, member });
}

onMounted(async () => {
  await loadMembers();
});

useEventBus('team:delete').on(() => loadMembers());
</script>

<template>
  <div v-if="signals.isLoading">
    Loading members...
  </div>
  <div v-else-if="signals.errorMessage">
    Could not load members: {{ signals.errorMessage }}
  </div>
  <DataTable
    v-else
    :value="members ?? []"
    data-key="uuid"
    class="members-list"
  >
    <Column
      header="Member"
    >
      <template #body="{ data: member }">
        <div
          class="flex justify-start items-center gap-2"
        >
          <UserAvatar
            :user="member"
          />
          <div>
            {{ member.displayName }}
          </div>
          <Tag
            :value="describeMemberRole(member)"
            :severity="getMemberRoleTagSeverity(member)"
            :pt="{ root: { class: 'font-normal' } }"
            :pt-options="{ mergeSections: true, mergeProps: true }"
          />
        </div>
      </template>
    </Column>
    <Column
      v-if="props.leaderboard.enableTeams"
      header="Team"
    >
      <template #body="{ data: member }">
        <MemberTeamForm
          v-model="member.teamId"
          :member="member"
          :leaderboard="props.leaderboard"
          @update:model-value="val => handleMemberTeamChange(val, member)"
        />
      </template>
    </Column>
    <Column
      header=""
    >
      <template #body="{ data: member }">
        <div
          class="flex justify-end gap-2"
        >
          <Button
            v-if="member.isOwner"
            outlined
            :icon="PrimeIcons.ANGLE_DOUBLE_DOWN"
            label="Demote"
            :disabled="(member.uuid === onlyOwnerUuid) || isActionLoading"
            @click="() => updateIsOwner(member, false)"
          />
          <Button
            v-else
            outlined
            :icon="PrimeIcons.ANGLE_DOUBLE_UP"
            label="Make Owner"
            :disabled="(member.uuid === onlyOwnerUuid) || isActionLoading"
            @click="() => updateIsOwner(member, true)"
          />
          <DangerButton
            outlined
            :icon="PrimeIcons.USER_MINUS"
            label="Kick"
            :disabled="(member.uuid === onlyOwnerUuid) || isActionLoading"
            action-description="remove this member from the leaderboard"
            action-command="Remove"
            action-in-progress-message="Removing"
            action-success-message="Removed"
            :confirmation-code="member.displayName"
            confirmation-code-description="the member's name"
            :action-fn="async () => { await kickMember(member); }"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<style>
.members-list table {
  table-layout: auto;
}

.members-list table tr > :nth-child(1) {
  width: 0;
}

.members-list table tr > :nth-child(3) {
  width: 0;
}

.members-list table tr > :nth-child(3) button {
  white-space: nowrap;
}
</style>
