<script setup lang="ts">

import { useRouter, type RouteLocationRaw } from 'vue-router';
const router = useRouter();

import TbLink, { type LinkDestination } from 'src/components/TbLink.vue';

export type MenuBarItem = {
  key: string;
  label: string;
  icon?: string;
  header?: boolean;
} & LinkDestination;

const props = defineProps<{
  items: MenuBarItem[];
}>();

const emit = defineEmits(['menu-navigation']);

function matchesCurrentRoute(to?: RouteLocationRaw, href?: string) {
  const routeToMatch = to ? router.resolve(to).href : href;
  const currentRoute = router.currentRoute.value.path;

  return routeToMatch === currentRoute;
}

</script>

<template>
  <div class="px-2">
    <ul
      class="m-0 p-0 list-none"
      role="menu"
    >
      <li
        v-for="item of props.items"
        :key="item.key"
        :class="[
          'rounded-md py-1 px-2 my-0.5 transition-shadow duration-200',
          'font-light',
          'hover:text-primary-600 dark:hover:text-primary-300 hover:bg-surface-100 dark:hover:bg-surface-400/10',
          { 'text-surface-700 dark:text-surface-0': !matchesCurrentRoute(item.to ?? undefined, item.href ?? undefined) },
          { 'bg-primary-100 dark:bg-primary-900 text-surface-950 dark:text-surface-50': matchesCurrentRoute(item.to ?? undefined, item.href ?? undefined) },
          { 'first:mt-0 mt-4': item.header },
          { 'ps-3': !item.header },
        ]"
        role="menuitem"
        :aria-label="item.label"
      >
        <TbLink
          :to="'to' in item ? item.to as RouteLocationRaw : null"
          :href="'href' in item ? item.href : null"
          :target="'target' in item ? item.target: null"
          @click="emit('menu-navigation')"
        >
          <div
            :class="[
              'flex gap-2 items-baseline',
              { 'font-normal text-xl': item.header },
            ]"
          >
            <div
              v-if="item.icon"
              :class="item.icon"
            />
            <div>
              {{ item.label }}
            </div>
          </div>
        </TbLink>
      </li>
    </ul>
  </div>
</template>
