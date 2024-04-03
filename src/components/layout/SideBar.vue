<script setup lang="ts">
import { ref, computed, defineEmits } from 'vue';

const emit = defineEmits(['menuItemClick']);

import { useWorkStore } from 'src/stores/work.ts';
import { WORK_PHASE_ORDER } from 'server/lib/models/work.ts';

import { useGoalStore } from 'src/stores/goal.ts';

import Menu from 'primevue/menu';
import { PrimeIcons } from 'primevue/api';

const menuPassthrough = ref({
  root: {
    class: [
      'pl-4 pr-4',
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

const sectionClasses = ['section', 'flex', 'items-baseline', 'gap-2', 'font-light', 'text-xl', 'm-0'].join(' ');

const workStore = useWorkStore();
workStore.populate();

const goalStore = useGoalStore();
goalStore.populate();

// TODO: this menu is a mess, it really needs to get fixed
const items = computed(() => {
  const dashboard = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: PrimeIcons.HOME,
      href: '/dashboard',
      command: () => emit('menuItemClick', '/dashboard'),
      section: true,
      first: true, // oof, wish I didn't have to do this
    }
  ];

  const works = [
    {
      key: 'projects',
      label: 'Projects',
      icon: PrimeIcons.FILE_EDIT,
      command: () => emit('menuItemClick', '/works'),
      href: '/works',
      section: true,
    },
    ...(workStore.works ?? []).toSorted((a, b) => WORK_PHASE_ORDER.indexOf(a.phase) - WORK_PHASE_ORDER.indexOf(b.phase)).map(work => ({
      key: `work-${work.id}`,
      label: work.title,
      command: () => emit('menuItemClick', `/works/${work.id}`),
      href: `/works/${work.id}`,
    })),
  ];

  const goals = [
    {
      key: 'goals',
      label: 'Goals',
      icon: PrimeIcons.STAR,
      command: () => emit('menuItemClick', '/goals'),
      href: '/goals',
      section: true,
    },
    ...(goalStore.goals ?? []).toSorted((a, b) => a.title < b.title ? -1 : a.title > b.title ? 1 : 0).map(goal => ({
      key: `goal-${goal.id}`,
      label: goal.title,
      command: () => emit('menuItemClick', `/goals/${goal.id}`),
      href: `/goals/${goal.id}`,
    })),
  ];

  // const yetToCome = [
  //   {
  //     label: 'Boards',
  //     key: 'boards',
  //     icon: PrimeIcons.CHART_BAR,
  //     href: '/boards',
  //     section: true,
  //   },
  //   { label: 'January Challenge' },
  //   { label: 'Overachievers Guild' },
  //   { label: 'Progress to 1M' },
  // ];

  const items: { label: string; href?: string; command?: () => void; icon?: string; section?: boolean; first?: boolean; }[] = [
    ...dashboard,
    ...works,
    ...goals,
    // ...yetToCome,
  ];

  return items;
});
</script>

<template>
  <Menu
    :model="items"
    :pt="menuPassthrough"
  >
    <template #item="{ item }">
      <div
        :class="{ 'flex cursor-pointer': true, [sectionClasses]: item.section }"
      >
        <span
          v-if="item.icon"
          :class="[item.icon, 'submenuheader-icon']"
        />
        <span class="flex-auto">{{ item.label }}</span>
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
