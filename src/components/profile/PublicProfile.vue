<script setup lang="ts">
import { defineProps } from 'vue';

import type { PublicProfile } from 'src/lib/api/profile.ts';

const props = defineProps<{
  profile: PublicProfile;
}>();

import { formatCountValue, formatCountCounter } from 'src/lib/tally.ts';
import { commaify, formatPercent } from 'src/lib/number.ts';
import { GOAL_CADENCE_UNIT_INFO } from 'server/lib/models/goal/consts';

import Card from 'primevue/card';
import Divider from 'primevue/divider';
import UserAvatar from '../avatar/UserAvatar.vue';
import SectionTitle from '../layout/SectionTitle.vue';
import StatTile from '../goal/StatTile.vue';
import DayCountHeatmap from '../stats/DayCountHeatmap.vue';
import TargetLineChart from '../goal/TargetLineChart.vue';
import ProfileHabitGauge from './ProfileHabitGauge.vue';

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
          :week-starts-on="props.profile.config.weekStartDay"
        />
      </div>
      <div
        v-for="habitSummary in props.profile.habitSummaries"
        :key="habitSummary.uuid"
      >
        <Divider />
        <SectionTitle :title="habitSummary.title" />
        <div class="habit-summary flex flex-wrap justify-evenly md:justify-start items-center gap-4 mb-4">
          <div
            v-if="habitSummary.currentRange !== null"
            class="current-progress"
          >
            <ProfileHabitGauge
              :goal="habitSummary"
              :range="habitSummary.currentRange"
            />
          </div>
          <div
            v-if="habitSummary.currentStreakLength !== null"
            class="current-streak"
          >
            <StatTile
              top-legend="Current streak"
              :highlight="commaify(habitSummary.currentStreakLength)"
              :suffix="GOAL_CADENCE_UNIT_INFO[habitSummary.parameters.cadence.unit].label[habitSummary.currentStreakLength === 1 ? 'singular' : 'plural']"
              bottom-legend="in a row"
            />
          </div>
          <div
            v-if="habitSummary.longestStreakLength !== null"
            class="current-streak"
          >
            <StatTile
              top-legend="Longest streak"
              :highlight="commaify(habitSummary.longestStreakLength)"
              :suffix="GOAL_CADENCE_UNIT_INFO[habitSummary.parameters.cadence.unit].label[habitSummary.longestStreakLength === 1 ? 'singular' : 'plural']"
              bottom-legend="in a row"
            />
          </div>
          <div class="success-rate">
            <StatTile
              :top-legend="`Success rate`"
              :highlight="`${habitSummary.totalRanges > 0 ? formatPercent(habitSummary.successfulRanges, habitSummary.totalRanges) : 0}%`"
              :bottom-legend="`or ${habitSummary.successfulRanges} / ${habitSummary.totalRanges}`"
            />
          </div>
        </div>
      </div>
      <div
        v-for="targetSummary in props.profile.targetSummaries"
        :key="targetSummary.uuid"
      >
        <Divider />
        <SectionTitle :title="targetSummary.title" />
        <div class="target-chart mb-4">
          <TargetLineChart
            :goal="targetSummary"
            :tallies="targetSummary.dayCounts"
          />
        </div>
      </div>
      <div
        v-for="projectSummary in props.profile.projectSummaries"
        :key="projectSummary.uuid"
      >
        <Divider />
        <SectionTitle :title="projectSummary.title" />
        <div class="project-summary flex flex-wrap justify-evenly gap-2 mb-4">
          <StatTile
            v-for="measure in Object.keys(projectSummary.totals)"
            :key="measure"
            :highlight="formatCountValue(projectSummary.totals[measure], measure)"
            :suffix="formatCountCounter(projectSummary.totals[measure], measure)"
          />
        </div>
        <div class="recent-activity mb-4">
          <DayCountHeatmap
            :day-counts="projectSummary.recentActivity"
            anchor="end"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
