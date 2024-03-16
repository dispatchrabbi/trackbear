<script setup lang="ts">
import { ref, computed, defineProps } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps<{
  collapsed?: boolean;
}>();

import { useWorkStore } from 'src/stores/work.ts';
import { WORK_PHASE_ORDER } from 'server/lib/models/work.ts';

import { useGoalStore } from 'src/stores/goal.ts';

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

const sectionClasses = ['section', 'flex', 'items-baseline', 'gap-2', 'font-light', 'text-xl', 'm-0'].join(' ');

const workStore = useWorkStore();
workStore.populateWorks();

const goalStore = useGoalStore();
goalStore.populateGoals();

const items = computed(() => {
  const dashboard = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: PrimeIcons.HOME,
      href: '/dashboard',
      section: true,
      first: true, // oof, wish I didn't have to do this
    }
  ];

  const works = [
    {
      key: 'projects',
      label: 'Projects',
      icon: PrimeIcons.FILE_EDIT,
      href: '/works',
      section: true,
    },
    ...(workStore.works ?? []).toSorted((a, b) => WORK_PHASE_ORDER.indexOf(a.phase) - WORK_PHASE_ORDER.indexOf(b.phase)).map(work => ({
      key: `work-${work.id}`,
      label: work.title,
      href: `/works/${work.id}`,
    })),
  ];

  const goals = [
    {
      key: 'goals',
      label: 'Goals',
      icon: PrimeIcons.STAR,
      href: '/goals',
      section: true,
    },
    ...(goalStore.goals ?? []).toSorted((a, b) => a.title < b.title ? -1 : a.title > b.title ? 1 : 0).map(goal => ({
      key: `goal-${goal.id}`,
      label: goal.title,
      href: `/goals/${goal.id}`,
    })),
  ]

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

  const items: { label: string; href?: string; icon?: string; section?: boolean; first?: boolean; }[] = [
    ...dashboard,
    ...works,
    ...goals,
    // ...yetToCome,
  ];

  if(props.collapsed) {
    return items.filter(item => item.section === true)
  } else {
    return items;
  }
});
</script>

<template>
  <Menu
    v-if="!props.collapsed"
    :model="items"
    :pt="menuPassthrough"
  >
    <template #item="{ item }">
      <RouterLink
        v-if="item.href"
        :to="item.href"
      >
        <div
          :class="{ 'flex': true, [sectionClasses]: item.section }"
        >
          <span
            v-if="item.icon"
            :class="[item.icon, 'submenuheader-icon']"
          />
          <span class="flex-auto">{{ item.label }}</span>
        </div>
      </RouterLink>
      <div
        v-else
        :class="{ 'flex': true, [sectionClasses]: item.section }"
      >
        <span
          v-if="item.icon"
          :class="[item.icon, 'submenuheader-icon']"
        />
        <span class="flex-auto">{{ item.label }}</span>
      </div>
    </template>
  </Menu>
  <Menu
    v-if="props.collapsed"
    :model="items"
    :pt="menuPassthrough"
  >
    <template #item="{ item }">
      <RouterLink
        v-if="item.href"
        :to="item.href"
      >
        <div
          :class="{ 'flex': true, [sectionClasses]: item.section }"
        >
          <span
            v-if="item.icon"
            :class="item.icon"
          />
        </div>
      </RouterLink>
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
server/lib/models/work
