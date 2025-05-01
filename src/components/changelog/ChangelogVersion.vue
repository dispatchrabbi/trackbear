<script setup lang="ts">

import Tag from 'primevue/tag';
import MIcon from 'src/components/MIcon.vue';

import markdownit from 'markdown-it';
const md = markdownit({
  html: false,
  xhtmlOut: true,
  linkify: true,
  typographer: true,
});

function combineEntryAndCredit(entry: string, credit?: string) {
  return entry + (credit ? ` (h/t ${credit})` : '');
}

const CHANGELOG_COLORS = {
  'NEW': 'primary',
  'CHANGED': 'info',
  'FIXED': 'success',
  'DEPRECATED': 'yellow',
  'REMOVED': 'warning',
  'SECURITY': 'danger',
};

const CHANGELOG_ICONS = {
  'NEW': 'star',
  'CHANGED': 'auto_awesome',
  'FIXED': 'build',
  'DEPRECATED': 'warning',
  'REMOVED': 'backspace',
  'SECURITY': 'security',
};

const props = defineProps<{
  version: string;
  changes: {
    tag: string;
    entry: string;
    credit?: string;
  }[];
  hideDivider?: boolean;
}>();

</script>

<template>
  <div class="mb-8">
    <h2
      :id="props.version"
      class="text-lg font-bold flex gap-1"
    >
      <div>{{ props.version }}</div>
      <a
        :href="'#' + props.version"
      ><MIcon icon="link" /></a>
    </h2>
    <div
      v-if="props.changes.length === 0"
      class="mt-2"
    >
      Nothing to report!
    </div>
    <ul>
      <li
        v-for="change of props.changes"
        :key="change.entry"
        class="mt-2"
      >
        <div>
          <Tag
            :value="change.tag"
            rounded
            :severity="CHANGELOG_COLORS[change.tag] || 'primary'"
            :pt="{ root: ({props}) => ({ class: ['!font-normal', { 'bg-yellow-500 dark:bg-yellow-400': props.severity == 'yellow', }] }), value: { class: 'mx-1' } }"
            :pt-options="{ mergeSections: true, mergeProps: true }"
          >
            <template #icon>
              <span class="mt-[2px] leading-none"><MIcon :icon="CHANGELOG_ICONS[change.tag] || 'info'" /></span>
            </template>
          </Tag>
        </div>
        <!-- eslint-disable vue/no-v-html -->
        <div v-html="md.render(combineEntryAndCredit(change.entry, change.credit))" />
        <!-- eslint-enable vue/no-v-html -->
      </li>
    </ul>
  </div>
</template>
