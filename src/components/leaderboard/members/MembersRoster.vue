<script setup lang="ts">
import { computed } from 'vue';
import type { LeaderboardSummary } from 'src/lib/api/leaderboard';
import type { MemberBio } from 'server/lib/models/leaderboard/types';
import { cmpTeam } from 'src/lib/board';
import SubsectionTitle from 'src/components/layout/SubsectionTitle.vue';
import TbAvatar from 'src/components/avatar/TbAvatar.vue';

const props = defineProps<{
  leaderboard: LeaderboardSummary;
}>();

const NULL_TEAM_ID = -1;
const SPECTATOR_ID = -2;
const groupMemberMap = computed(() => {
  const grouped = new Map<number, MemberBio[]>();
  for(const member of props.leaderboard.members) {
    const groupId = member.isParticipant ?
      props.leaderboard.enableTeams ? (member.teamId ?? NULL_TEAM_ID) : NULL_TEAM_ID :
      SPECTATOR_ID;

    const group = grouped.get(groupId) ?? [];
    group.push(member);
    grouped.set(groupId, group);
  }

  return grouped;
});

const orderedGroups = computed(() => {
  const teamMap = Object.fromEntries(props.leaderboard.teams.map(team => ([team.id, team])));

  const teams = Array.from(groupMemberMap.value.keys()).filter(id => id >= 0).sort((a, b) => {
    return cmpTeam(teamMap[a], teamMap[b]);
  }).map(teamId => ({
    id: teamId,
    name: teamMap[teamId].name,
    color: teamMap[teamId].color,
  }));

  if(groupMemberMap.value.get(NULL_TEAM_ID)?.length) {
    teams.push({
      id: NULL_TEAM_ID,
      name: props.leaderboard.enableTeams ? 'Not on a team' : 'Participants',
      color: '',
    });
  }

  if(groupMemberMap.value.get(SPECTATOR_ID)?.length) {
    teams.push({
      id: SPECTATOR_ID,
      name: 'Spectators',
      color: '',
    });
  }

  return teams;
});
</script>

<template>
  <SubsectionTitle
    :title="props.leaderboard.enableTeams ? 'Teams' : 'Members'"
  />
  <div class="flex flex-row flex-wrap gap-2 w-full">
    <div
      v-for="group of orderedGroups"
      :key="group.id"
      class="flex-auto member-roster-group"
    >
      <h3 class="text-l font-light font-heading text-balance">
        {{ group.name }}
      </h3>
      <div class="mb-4 flex flex-wrap gap-2">
        <!-- TODO: add a crown for owners, or something-->
        <TbAvatar
          v-for="member of groupMemberMap.get(group.id)"
          :key="member.id"
          :name="member.displayName"
          :avatar-image="member.avatar"
          use-bear-initial
        />
      </div>
    </div>
  </div>
</template>

<style>
.member-roster-group {
  /* This gets us two groups across while taking into account the gap */
  flex-basis: calc(50% - 0.5rem);
}
</style>
