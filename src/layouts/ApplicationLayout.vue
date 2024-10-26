<script setup lang="ts">
import { ref, computed, defineProps } from 'vue';
import { breakpointsTailwind, useBreakpoints, useLocalStorage } from '@vueuse/core';
const breakpoints = useBreakpoints(breakpointsTailwind);

import type { MenuItem } from 'primevue/menuitem';

import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import BannerContainer from 'src/components/banner/BannerContainer.vue';
import TrackbearMasthead from 'src/components/layout/TrackbearMasthead.vue';
import Button from 'primevue/button';
import AppBar from 'src/components/layout/AppBar.vue';
import SideBar from 'src/components/layout/SideBar.vue';
import LogProgressButton from 'src/components/tally/LogProgressButton.vue';
import { PrimeIcons } from 'primevue/api';

const props = defineProps<{
  breadcrumbs: MenuItem[];
}>();

const collapsed = useLocalStorage('sidebar-collapsed', false);
function handleMenuNavigation() {
  if(breakpoints.smaller('md').value) {
    collapsed.value = true;
  }
}

const isLoading = ref<boolean>(true);
// attempt to populate the user, but only care about failing
try {
  await userStore.populate();
  isLoading.value = false;
} catch {
  router.push({ name: 'login', query: { redirectTo: router.currentRoute.value.fullPath } });
}

const showPage = computed(() => {
  return isLoading.value === false && userStore.user != null;
});

</script>

<template>
  <template v-if="showPage">
    <div class="banner">
      <BannerContainer />
    </div>
    <div
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
        <div class="px-4 pt-4 pb-1 flex justify-between">
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
          <SideBar
            @menu-navigation="handleMenuNavigation"
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
    <div
      class="log-progress-button fixed bottom-8 right-8"
    >
      <LogProgressButton />
    </div>
  </template>
</template>

<style scoped>
.application > .side {
  transition-property: width;
  transition-duration: 250ms;
  transition-timing-function: ease-in-out;
}
</style>
