<script setup lang="ts">
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
  'DEPRECATED': 'secondary',
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
  <VaDivider v-if="!props.hideDivider" />
  <div class="mb-8">
    <h2
      :id="props.version"
      class="text-2xl font-bold"
    >
      {{ props.version }}
      <a
        :href="'#' + props.version"
      ><VaIcon name="link" /></a>
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
          <VaChip
            :color="CHANGELOG_COLORS[change.tag] || 'secondary'"
            :icon="CHANGELOG_ICONS[change.tag] || 'info'"
          >
            {{ change.tag }}
          </VaChip>
        </div>
        <!-- eslint-disable vue/no-v-html -->
        <div v-html="md.render(combineEntryAndCredit(change.entry, change.credit))" />
        <!-- eslint-enable vue/no-v-html -->
      </li>
    </ul>
  </div>
</template>
