<script setup lang="ts">
import { ref } from 'vue';

import Menu from 'primevue/menu';
import { PrimeIcons } from 'primevue/api';

const menuPassthrough = ref({
  root: {
    class: [
      'px-4',
    ],
  },
  content: ({ context }) => ({
    class: [
      // Shape
      'rounded-md',
      // Layout
      'py-1 px-2',
      { 'mt-4': context.item.section && !context.item.first },
      // Colors
      {
        'text-surface-700 dark:text-surface-0': !context.focused,
        'bg-surface-100 text-primary-500 dark:bg-surface-300/10 dark:text-primary-400': context.focused
      },
      // Transitions
      'transition-shadow',
      'duration-200',
      // States
      'hover:text-primary-600 dark:hover:text-primary-400',
      'hover:bg-surface-100 dark:hover:bg-surface-400/10'
    ]
  }),
});

const items = ref([
  {
    label: 'Dashboard',
    icon: PrimeIcons.HOME,
    section: true,
    first: true, // oof, wish I didn't have to do this
  },
  {
    label: 'Works',
    icon: PrimeIcons.FILE_EDIT,
    section: true,
  },
  { label: 'Romantic Disaster' },
  { label: 'Shadowless' },
  { label: 'Background Tam Lin' },
  {
    label: 'Goals',
    icon: PrimeIcons.STAR,
    section: true,
  },
  { label: 'January Challenge' },
  { label: 'Edit Every Day' },
  { label: 'NaNoWriMo 2024' },
  {
    label: 'Boards',
    icon: PrimeIcons.CHART_BAR,
    section: true,
  },
  { label: 'January Challenge' },
  { label: 'Overachievers Guild' },
  { label: 'Progress to 1M' },
]);
</script>

<template>
  <Menu
    :model="items"
    :pt="menuPassthrough"
  >
    <template #item="{ item, action }">
      <div
        v-if="item.section"
        :class="['section', 'flex', 'items-baseline', 'gap-2', 'font-light', 'text-xl', 'm-0']"
      >
        <span :class="[item.icon, 'submenuheader-icon']" />
        <span class="flex-auto">{{ item.label }}</span>
      </div>
      <div
        v-else
        class="item"
      >
        {{ item.label }}
      </div>
    </template>
  </Menu>
</template>

<style scoped>
.submenuheader-icon {
  font-size: 1rem;
}

.submenuheader-new {
  font-size: 1rem;
}
</style>
