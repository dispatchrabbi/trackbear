<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, onMounted, useTemplateRef } from 'vue';

import { RouterLink } from 'vue-router';

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { useLastChangelogViewed, getCurrentVersion, cmpVersion } from 'src/lib/changelog.ts';
const lastChangelogViewed = useLastChangelogViewed();
const flagUpdates = ref(false);

import { PrimeIcons } from 'primevue/api';
import Button from 'primevue/button';
import Menu from 'primevue/menu';
import Breadcrumb from 'primevue/breadcrumb';
import type { MenuItem } from 'primevue/menuitem';
import TrackbearMasthead from './TrackbearMasthead.vue';
import UserAvatar from '../UserAvatar.vue';
import Tag from 'primevue/tag';

const props = defineProps<{
  breadcrumbs: MenuItem[];
  collapsed: boolean;
}>();

const emit = defineEmits(['sidebar:toggle']);

const toggleSidebar = function() {
  emit('sidebar:toggle');
};

const userMenu = useTemplateRef('userMenu');
const userMenuItems = computed(() => {
  const items = [
    {
      label: 'Your Account',
      items: [
        { icon: PrimeIcons.USER, label: 'Account', to: { name: 'account' } },
        { icon: PrimeIcons.SLIDERS_V, label: 'Settings', to: { name: 'settings' } },
        { icon: PrimeIcons.TAG, label: 'Manage Tags', to: { name: 'tags' } },
        { icon: PrimeIcons.KEY, label: 'API Keys', to: { name: 'api-keys' } },
      ],
    },
    { separator: true },
    {
      label: 'TrackBear',
      items: [
        { icon: PrimeIcons.BOOK, label: 'About', to: { name: 'about' } },
        { icon: PrimeIcons.WRENCH, label: 'Changelog', to: { name: 'changelog' }, tag: flagUpdates.value ? { text: 'Updates!', icon: PrimeIcons.SPARKLES } : undefined },
        { icon: PrimeIcons.SHIELD, label: 'Privacy', to: { name: 'privacy' } },
        { icon: PrimeIcons.QUESTION_CIRCLE, label: 'Help', href: 'https://help.trackbear.app/', target: '_blank' },
        { icon: PrimeIcons.ENVELOPE, label: 'Contact', to: { name: 'contact' } },
        { icon: PrimeIcons.HEART_FILL, label: 'Support the Dev', href: '/ko-fi', target: '_blank', iconColor: 'text-primary-500 dark:text-primary-400' },
      ],
    },
    { separator: true },
    { icon: PrimeIcons.SIGN_OUT, label: 'Log Out', to: { name: 'logout' } },
  ] as MenuItem[];

  return items;
});
const toggleUserMenu = ev => {
  if(!userMenu.value) {
    return;
  }

  userMenu.value.toggle(ev);
};

async function checkForUpdates() {
  const latestVersion = getCurrentVersion();
  if(cmpVersion(latestVersion, lastChangelogViewed.value) > 0) {
    flagUpdates.value = true;
  }
}

onMounted(() => {
  checkForUpdates();
});

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
        :user="userStore.user!"
        :icon="flagUpdates ? PrimeIcons.SPARKLES : null"
        icon-class="primary"
      />
      <div class="font-light">
        {{ userStore.user!.displayName }}
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
        <div class="flex items-center">
          <RouterLink
            v-if="!item.target"
            :to="item.to"
            v-bind="itemProps.action"
            class="w-full"
          >
            <span :class="[item.icon, item.iconColor]" />
            <span class="leading-6 text-sm font-medium ml-2">{{ item.label }}</span>
          </RouterLink>
          <a
            v-else
            :href="item.href"
            :target="item.target"
            v-bind="itemProps.action"
            class="w-full"
          >
            <span :class="[item.icon, item.iconColor]" />
            <span class="leading-6 text-sm font-medium ml-2">{{ item.label }}</span>
          </a>
          <div class="spacer flex-auto" />
          <Tag
            v-if="item.tag"
            :icon="item.tag.icon"
            :value="item.tag.text"
          />
        </div>
      </template>
    </Menu>
  </div>
</template>

<style scoped>
</style>
