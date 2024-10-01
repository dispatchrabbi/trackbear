<script setup lang="ts">
import { defineProps } from 'vue';

import type { PublicProfile } from 'src/lib/api/profile.ts';

const props = defineProps<{
  profile: PublicProfile;
}>()

import { formatCountValue, formatCountCounter } from 'src/lib/tally.ts';

import Card from 'primevue/card';
import Divider from 'primevue/divider';
import UserAvatar from '../UserAvatar.vue';
import SectionTitle from '../layout/SectionTitle.vue';
import StatTile from '../goal/StatTile.vue';
import DayCountHeatmap from '../stats/DayCountHeatmap.vue';

</script>

<template>
  <Card>
    <template #header>
      <div class="flex items-center gap-2 p-4">
        <UserAvatar
          :user="{ displayName: props.profile.displayName, avatar: props.profile.avatar }"
          size="xlarge"
        />
        <div class="flex flex-col">
          <div class="text-xl font-bold">
            {{ profile.displayName }}
          </div>
          <div class="text-base font-light">
            @{{ profile.username }}
          </div>
        </div>
      </div>
    </template>
    <template #content>
      <SectionTitle title="Overall Activity" />
      <div class="total-counts flex flex-wrap justify-evenly gap-2 mb-4">
        <StatTile
          v-for="measure in Object.keys(props.profile.lifetimeTotals)"
          :key="measure"
          :highlight="formatCountValue(props.profile.lifetimeTotals[measure], measure)"
          :suffix="formatCountCounter(props.profile.lifetimeTotals[measure], measure)"
        />
      </div>
      <div class="recent-activity mb-4">
        <DayCountHeatmap
          :day-counts="props.profile.recentActivity"
          anchor="end"
        />
      </div>
      <div
        v-for="workSummary in props.profile.workSummaries"
        :key="workSummary.uuid"
      >
        <Divider />
        <SectionTitle :title="workSummary.title" />
        <div class="total-counts flex flex-wrap justify-evenly gap-2 mb-4">
          <StatTile
            v-for="measure in Object.keys(workSummary.totals)"
            :key="measure"
            :highlight="formatCountValue(workSummary.totals[measure], measure)"
            :suffix="formatCountCounter(workSummary.totals[measure], measure)"
          />
        </div>
        <div class="recent-activity mb-4">
          <DayCountHeatmap
            :day-counts="workSummary.recentActivity"
            anchor="end"
          />
        </div>
      </div>
    </template>
  </Card>
</template>