<script setup lang="ts">
import { ref, computed, defineEmits } from 'vue';

const emit = defineEmits(['menuItemClick']);

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

// TODO: this menu is a mess, it really needs to get fixed
const items = computed(() => {
  const app = [
    {
      key: 'app',
      label: 'Back to App',
      icon: PrimeIcons.UNDO,
      href: '/dashboard',
      command: () => emit('menuItemClick', '/dashboard'),
      section: true,
      first: true,// oof, wish I didn't have to do this
    },
  ];

  const banners = [
    {
      key: 'banners',
      label: 'Banners',
      icon: PrimeIcons.MEGAPHONE,
      href: '/admin/banners',
      command: () => emit('menuItemClick', '/admin/banners'),
      section: true,
    },
  ];

  const items: { label: string; href?: string; command?: () => void; icon?: string; section?: boolean; first?: boolean; }[] = [
    ...app,
    ...banners,
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
