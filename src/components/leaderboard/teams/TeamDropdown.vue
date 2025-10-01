<script setup lang="ts">
import { computed } from 'vue';

import { type LeaderboardTeam } from 'server/api/v1/leaderboard';

import TeamAvatar from 'src/components/TeamAvatar.vue';
import Dropdown from 'primevue/dropdown';

const model = defineModel<number | null>({ required: true });
const props = withDefaults(defineProps<{
  idPrefix?: string;
  invalid?: boolean;
  teams: LeaderboardTeam[];
}>(), {
  idPrefix: 'form',
  invalid: false,
});

const teamOptions = computed(() => {
  return [
    {
      id: null,
      name: '(no team)',
      color: '',
    },
    ...props.teams.map(team => ({
      id: team.id,
      name: team.name,
      color: team.color,
    })),
  ];
});

const teamOptionsMap = computed(() => {
  const map = new Map();
  for(const option of teamOptions.value) {
    map.set(option.id, option);
  }

  return map;
});
</script>

<template>
  <Dropdown
    :id="`${props.idPrefix}-team`"
    v-model="model"
    :options="teamOptions"
    option-label="name"
    option-value="id"
    :invalid="invalid"
  >
    <template #value="{value}">
      <div class="flex gap-2 items-center">
        <TeamAvatar
          :name="value === null ? '' : teamOptionsMap.get(value).name"
          :color="teamOptionsMap.get(value).color"
        />
        <div>{{ teamOptionsMap.get(value).name }}</div>
      </div>
    </template>
    <template #option="{option}">
      <div class="flex gap-2 items-center">
        <TeamAvatar
          :name="option.id === null ? '' : option.name"
          :color="option.color"
        />
        <div>{{ option.name }}</div>
      </div>
    </template>
  </Dropdown>
</template>
