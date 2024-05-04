<script setup lang="ts">
import { ref, defineProps, defineEmits } from "vue";

import { RouterLink } from "vue-router";

import { useUserStore } from "src/stores/user.ts";
const userStore = useUserStore();

import { PrimeIcons } from 'primevue/api';
import Button from "primevue/button";
import Menu from "primevue/menu";
import Breadcrumb from "primevue/breadcrumb";
import type { MenuItem } from 'primevue/menuitem';
import TrackbearMasthead from "./TrackbearMasthead.vue";
import UserAvatar from "../UserAvatar.vue";

const props = defineProps<{
  breadcrumbs: MenuItem[];
  collapsed: boolean;
}>();

const emit = defineEmits([ 'sidebar:toggle' ]);

const toggleSidebar = function() {
  emit('sidebar:toggle');
}

const userMenu = ref(null);
const userMenuItems = ref<MenuItem[]>([
  {
    label: 'Settings',
    items: [
      { icon: PrimeIcons.COG, label: 'Account Settings', to: { name: 'account' } },
      { icon: PrimeIcons.TAG, label: 'Manage Tags', to: { name: 'tags' } },
    ] ,
  },
  {
    label: 'TrackBear',
    items: [
      { icon: PrimeIcons.INFO_CIRCLE, label: 'About', to: { name: 'about' } },
      { icon: PrimeIcons.WRENCH, label: 'Changelog', to: { name: 'changelog' } },
      { icon: PrimeIcons.SHIELD, label: 'Privacy', to: { name: 'privacy' } },
      { icon: PrimeIcons.HEART_FILL, label: 'Support the Dev', href: '/ko-fi', target: '_blank', iconColor: 'text-primary-500 dark:text-primary-400' },
    ]
  },
  { separator: true },
  { icon: PrimeIcons.SIGN_OUT, label: 'Log Out', to: { name: 'logout' } },
]);
const toggleUserMenu = ev => userMenu.value.toggle(ev);

</script>

<template>
  <div class="appbar flex items-center gap-2 px-4 py-2">
    <Button
      :icon="PrimeIcons.BARS"
      size="large"
      severity="secondary"
      text
      @click="toggleSidebar"
    />
    <TrackbearMasthead
      v-if="props.collapsed"
      :hide-logo="true"
      link-to="dashboard"
    />
    <Breadcrumb
      class="hidden md:block"
      :model="props.breadcrumbs"
    >
      <template #item="{ item, props: itemProps }">
        <RouterLink
          v-if="item.url"
          :to="item.url"
          v-bind="itemProps.action"
        >
          <span :class="[item.icon, 'text-color']" />
          <span>{{ item.label }}</span>
        </RouterLink>
        <span
          v-else
          class="font-semibold text-sm flex items-center gap-x-1.5 rounded-md text-surface-500 dark:text-white/70"
        >
          <span :class="[item.icon, 'text-color']" />
          <span>{{ item.label }}</span>
        </span>
      </template>
    </Breadcrumb>
    <div class="spacer flex-auto" />
    <div
      :class="[
        'mr-2 p-1 pr-2 rounded-md',
        'flex items-center gap-2',
        'hover:text-primary-600 dark:hover:text-primary-300 hover:bg-surface-100 dark:hover:bg-surface-400/10 cursor-pointer',
      ]"
      aria-haspopup="true"
      aria-controls="user-menu"
      @click="toggleUserMenu"
    >
      <UserAvatar
        :user="userStore.user"
      />
      <div class="font-light">
        {{ userStore.user.displayName }}
      </div>
    </div>
    <Menu
      id="user-menu"
      ref="userMenu"
      :model="userMenuItems"
      :popup="true"
      :pt="{ separator: { class: 'border-t border-surface-200 dark:border-surface-600 my-1' } }"
      :pt-options="{ mergeSections: true, mergeProps: true, }"
    >
      <template #item="{ item, props: itemProps }">
        <RouterLink
          v-if="!item.target"
          :to="item.to"
          v-bind="itemProps.action"
        >
          <span :class="[item.icon, item.iconColor]" />
          <span class="leading-6 text-sm font-medium ml-2">{{ item.label }}</span>
        </RouterLink>
        <a
          v-else
          :href="item.href"
          :target="item.target"
          v-bind="itemProps.action"
        >
          <span :class="[item.icon, item.iconColor]" />
          <span class="leading-6 text-sm font-medium ml-2">{{ item.label }}</span>
        </a>
      </template>
    </Menu>
  </div>
</template>

<style scoped>
</style>
