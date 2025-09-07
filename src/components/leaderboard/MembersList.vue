<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { useAsyncSignals, defaultOnError } from 'src/lib/use-async-signals';

import { type Leaderboard, type Membership, listMembers, updateMember, removeMember } from 'src/lib/api/leaderboard';
import { cmpMember } from 'src/lib/board';

import { PrimeIcons } from 'primevue/api';
import DataView from 'primevue/dataview';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

import UserAvatar from '../UserAvatar.vue';
import DangerButton from 'src/components/shared/DangerButton.vue';

const props = defineProps<{
  leaderboard: Leaderboard;
}>();

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
  await updateMember(props.leaderboard.uuid, member.id, { isOwner: willBeOwner });
}, defaultOnError, async () => { await loadMembers(); return null; });

const [kickMember, kickMemberSignals] = useAsyncSignals(async function(member: Membership) {
  await removeMember(props.leaderboard.uuid, member.id);
}, defaultOnError, async () => { await loadMembers(); return null; });

const isActionLoading = computed(() => {
  return updateMemberSignals.isLoading || kickMemberSignals.isLoading;
});

onMounted(async () => {
  await loadMembers();
});
</script>

<template>
  <div v-if="signals.isLoading">
    Loading members...
  </div>
  <div v-else-if="signals.errorMessage">
    Could not load members: {{ signals.errorMessage }}
  </div>
  <DataView
    v-else
    :value="members ?? []"
    data-key="uuid"
  >
    <template #list="{ items }">
      <div class="grid grid-cols-1 divide-y">
        <div
          v-for="member of items"
          :key="member.uuid"
          class="flex flex-col md:flex-row py-4 gap-2"
        >
          <div class="flex items-center gap-2 flex-grow">
            <UserAvatar
              :user="member"
            />
            <div>
              {{ member.displayName }}
              <Tag
                :value="describeMemberRole(member)"
                :severity="getMemberRoleTagSeverity(member)"
                :pt="{ root: { class: 'font-normal' } }"
                :pt-options="{ mergeSections: true, mergeProps: true }"
              />
            </div>
          </div>
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
        </div>
      </div>
    </template>
  </DataView>
</template>
