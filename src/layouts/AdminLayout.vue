<script setup lang="ts">
import { defineProps, onMounted } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
const breakpoints = useBreakpoints(breakpointsTailwind);

import type { MenuItem } from 'primevue/menuitem';

import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { useAdminUserStore } from 'src/stores/admin-user.ts';
const adminUserStore = useAdminUserStore();

import BannerContainer from 'src/components/banner/BannerContainer.vue';
import TrackbearMasthead from 'src/components/layout/TrackbearMasthead.vue';
import Button from 'primevue/button';
import AppBar from 'src/components/layout/AppBar.vue';
import AdminSideBar from 'src/components/layout/AdminSideBar.vue';
import { PrimeIcons } from 'primevue/api';

const props = defineProps<{
  breadcrumbs: MenuItem[];
}>();

const collapsed = useLocalStorage('sidebarCollapsed', false);

type MenuItemClickOptions = { openInNewTab?: boolean };
function handleMenuItemClick(href?: string, options?: MenuItemClickOptions) {
  if(breakpoints.smaller('md').value) {
    collapsed.value = true;
  }
  if(href) {
    if(options?.openInNewTab) {
      window.open(href);
    } else {
      router.push(href);
    }
  }
}

onMounted(async () => {
  // attempt to populate the user, but only care about failing
  await userStore.populate().catch(() => {
    router.push({ name: 'login' });
  });

  // grab admin user permissions and we're going to want to check them too
  await adminUserStore.populate()
    .then(() => {
      if(!adminUserStore.perms.isAdmin) {
        router.push({ name: 'dashboard' });
      }
    })
    .catch(() => {
      router.push({ name: 'dashboard' });
    });
});

</script>

<template>
  <div class="banner">
    <BannerContainer />
  </div>
  <div
    v-if="userStore.user && adminUserStore.perms"
    :class="[ 'application flex', collapsed ? 'sidebar-collapsed' : null ]"
  >
    <div
      :class="[
        'side h-screen overflow-y-auto overscroll-contain flex-none flex flex-col bg-surface-0 dark:bg-surface-800 shadow-md',
        { 'w-0 md:w-0': collapsed },
        { 'w-screen md:w-64': !collapsed },
        'z-50 md:z-auto fixed md:static',
      ]"
    >
      <div class="p-4 flex justify-between">
        <TrackbearMasthead
          link-to="dashboard"
        />
        <Button
          class="md:hidden"
          :icon="PrimeIcons.CHEVRON_LEFT"
          text
          @click="collapsed = true"
        />
      </div>
      <div class="mb-4">
        <AdminSideBar
          @menu-item-click="handleMenuItemClick"
        />
      </div>
    </div>
    <div class="main flex-auto h-screen overflow-y-auto overscroll-contain flex flex-col">
      <div class="bar sticky top-0 z-10 bg-surface-0 dark:bg-surface-800 box-border border-solid border-b-[1px] border-primary-500 dark:border-primary-400">
        <AppBar
          :breadcrumbs="props.breadcrumbs"
          :collapsed="collapsed"
          @sidebar:toggle="collapsed = !collapsed"
        />
      </div>
      <div class="content px-4 pt-4 pb-24">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.application > .side {
  transition-property: width;
  transition-duration: 250ms;
  transition-timing-function: ease-in-out;
}

</style>
