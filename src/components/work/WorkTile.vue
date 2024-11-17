<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue';
import { breakpointsTailwind, useBreakpoints, useEventBus } from '@vueuse/core';
const breakpoints = useBreakpoints(breakpointsTailwind);

import { type Work, type SummarizedWork, starWork } from 'src/lib/api/work.ts';
import { WORK_PHASE } from 'server/lib/models/work.ts';

const props = defineProps<{
  work: SummarizedWork;
}>();

const emit = defineEmits(['work:star']);
const eventBus = useEventBus<{ work: Work }>('work:star');

import { formatCount } from 'src/lib/tally.ts';

import WorkCover from './WorkCover.vue';
import Tag from 'primevue/tag';
import { PrimeIcons } from 'primevue/api';

const WORK_PHASE_TAG_COLORS = {
  [WORK_PHASE.PLANNING]: 'help',
  [WORK_PHASE.OUTLINING]: 'info',
  [WORK_PHASE.DRAFTING]: 'primary',
  [WORK_PHASE.REVISING]: 'accent',
  [WORK_PHASE.ON_HOLD]: 'warning',
  [WORK_PHASE.FINISHED]: 'success',
  [WORK_PHASE.ABANDONED]: 'danger',
};

const isStarLoading = ref<boolean>(false);
async function onStarClick() {
  isStarLoading.value = true;

  const newStarVal = !props.work.starred;
  await starWork(props.work.id, newStarVal);
  isStarLoading.value = false;

  emit('work:star', { id: props.work.id, starred: newStarVal });
  eventBus.emit({ work: props.work });
}

const isNotMobile = computed(() => {
  return breakpoints.greater('sm').value;
})

</script>

<template>
  <div class="work-tile flex gap-3 rounded-lg shadow-md bg-surface-0 dark:bg-surface-900 mb-2">
    <div
      v-if="isNotMobile"
      class="work-tile-cover self-center flex-none w-32 h-48 my-auto bg-surface-100 dark:bg-surface-950 rounded-s-lg"
    >
      <WorkCover
        :work="work"
        rounded="lg"
        shadow="none"
      />
    </div>
    <div class="work-tile-content flex-grow py-4 pr-4 pl-4 md:pl-0 flex flex-col gap-2">
      <div class="flex gap-2 items-baseline">
        <!-- star, phase, title -->
        <span
          :class="[
            isStarLoading ? PrimeIcons.SPINNER + ' pi-spin' : props.work.starred ? PrimeIcons.STAR_FILL : PrimeIcons.STAR,
            'text-primary-500 dark:text-primary-400'
          ]"
          @click.prevent="onStarClick"
        />
        <div class="text-lg font-medium">
          {{ props.work.title }}
        </div>
        <div class="spacer flex-auto" />
        <Tag
          :value="props.work.phase"
          :severity="WORK_PHASE_TAG_COLORS[props.work.phase]"
          :pt="{ root: { class: 'font-normal uppercase' } }"
          :pt-options="{ mergeSections: true, mergeProps: true }"
        />
      </div>
      <div class="flex justify-between gap-2">
        <div class="font-light italic text-balance">
          <!-- description -->
          {{ work.description }}
        </div>
        <div class="flex flex-col text-right">
          <!-- update info -->
          <div
            v-for="(total, measure) in props.work.totals"
            :key="measure"
            class="total"
          >
            <span
              class="font-light whitespace-nowrap"
            >{{ formatCount(total, measure) }}</span>
          </div>
          <div
            v-if="Object.keys(props.work.totals).length < 1"
          >
            <span class="font-light whitespace-nowrap">No progress yet!</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- <Card
    :pt="{ content: { class: '!py-0' } }"
    :pt-options="{ mergeSections: true, mergeProps: true }"
  >
    <template #title>
      <div class="flex gap-2 items-baseline">
        <span
          :class="[
            isStarLoading ? PrimeIcons.SPINNER + ' pi-spin' : props.work.starred ? PrimeIcons.STAR_FILL : PrimeIcons.STAR,
            'text-primary-500 dark:text-primary-400'
          ]"
          @click.prevent="onStarClick"
        />
        <div>{{ props.work.title }}</div>
        <div class="spacer flex-auto" />
        <Tag
          :value="props.work.phase"
          :severity="WORK_PHASE_TAG_COLORS[props.work.phase]"
          :pt="{ root: { class: 'font-normal uppercase' } }"
          :pt-options="{ mergeSections: true, mergeProps: true }"
        />
      </div>
    </template>
    <template #content>
      <div class="flex gap-2 items-baseline">
        <div class="font-light italic grow">
          {{ work.description }}
        </div>
        <div class="measures flex-none flex flex-col md:flex-row md:gap-2">
          <div
            v-for="(total, measure) in props.work.totals"
            :key="measure"
            class="total text-right"
          >
            <span
              class="font-light"
            >{{ formatCount(total, measure) }}</span>
          </div>
          <div
            v-if="Object.keys(props.work.totals).length < 1"
          >
            <span class="font-light">No progress yet!</span>
          </div>
        </div>
      </div>
    </template>
  </Card> -->
</template>

<style scoped>
</style>
