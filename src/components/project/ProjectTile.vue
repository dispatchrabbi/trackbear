<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, withDefaults } from 'vue';
import { breakpointsTailwind, useBreakpoints, useEventBus } from '@vueuse/core';
const breakpoints = useBreakpoints(breakpointsTailwind);

import { type Project, type SummarizedProject, starProject } from 'src/lib/api/project';
import { PROJECT_PHASE } from 'server/lib/models/project/consts';

const props = withDefaults(defineProps<{
  project: SummarizedProject;
  showCover?: boolean;
}>(), {
  showCover: true,
});

const emit = defineEmits(['project:star']);
const eventBus = useEventBus<{ project: Project }>('project:star');

import { formatCount } from 'src/lib/tally.ts';

import ProjectCover from './ProjectCover.vue';
import Tag from 'primevue/tag';
import { PrimeIcons } from 'primevue/api';

const WORK_PHASE_TAG_COLORS = {
  [PROJECT_PHASE.PLANNING]: 'help',
  [PROJECT_PHASE.OUTLINING]: 'info',
  [PROJECT_PHASE.DRAFTING]: 'primary',
  [PROJECT_PHASE.REVISING]: 'accent',
  [PROJECT_PHASE.ON_HOLD]: 'warning',
  [PROJECT_PHASE.FINISHED]: 'success',
  [PROJECT_PHASE.ABANDONED]: 'danger',
};

const isStarLoading = ref<boolean>(false);
async function onStarClick() {
  isStarLoading.value = true;

  const newStarVal = !props.project.starred;
  await starProject(props.project.id, newStarVal);
  isStarLoading.value = false;

  emit('project:star', { id: props.project.id, starred: newStarVal });
  eventBus.emit({ project: props.project });
}

const isNotMobile = computed(() => {
  return breakpoints.greater('sm').value;
});

</script>

<template>
  <div class="project-tile flex gap-3 rounded-lg shadow-md bg-surface-0 dark:bg-surface-900 mb-2">
    <div
      v-if="props.showCover && isNotMobile"
      class="project-tile-cover flex flex-none w-32 h-48 my-auto bg-surface-100 dark:bg-surface-950 rounded-s-lg"
    >
      <ProjectCover
        :project="project"
        rounded="lg"
        shadow="none"
        class="flex-1 self-center"
      />
    </div>
    <div
      :class="[
        'project-tile-content flex-grow py-4 pr-4 pl-4 flex flex-col gap-2',
        { 'md:pl-0': props.showCover },
      ]"
    >
      <div class="flex gap-2 items-baseline">
        <!-- star, phase, title -->
        <span
          :class="[
            isStarLoading ? PrimeIcons.SPINNER + ' pi-spin' : props.project.starred ? PrimeIcons.STAR_FILL : PrimeIcons.STAR,
            'text-primary-500 dark:text-primary-400'
          ]"
          @click.prevent="onStarClick"
        />
        <div class="text-lg font-medium">
          {{ props.project.title }}
        </div>
        <div class="spacer flex-auto" />
        <Tag
          :value="props.project.phase"
          :severity="WORK_PHASE_TAG_COLORS[props.project.phase]"
          :pt="{ root: { class: 'font-normal uppercase' } }"
          :pt-options="{ mergeSections: true, mergeProps: true }"
        />
      </div>
      <div class="flex justify-between gap-2">
        <div class="font-light italic text-balance">
          <!-- description -->
          {{ project.description }}
        </div>
        <div class="flex flex-col text-right">
          <!-- update info -->
          <div
            v-for="(total, measure) in props.project.totals"
            :key="measure"
            class="total"
          >
            <span
              class="font-light whitespace-nowrap"
            >{{ formatCount(total, measure) }}</span>
          </div>
          <div
            v-if="Object.keys(props.project.totals).length < 1"
          >
            <span class="font-light whitespace-nowrap">No progress yet!</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
