<script setup lang="ts">
import { defineProps } from 'vue';
import type { MenuItem } from 'primevue/menuitem';

import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import BannerContainer from 'src/components/banner/BannerContainer.vue';
import TrackbearMasthead from 'src/components/layout/TrackbearMasthead.vue';
import AppBar from 'src/components/layout/AppBar.vue';
import SideBar from 'src/components/layout/SideBar.vue';
import LogProgressButton from 'src/components/tally/LogProgressButton.vue';

const props = defineProps<{
  breadcrumbs: MenuItem[];
}>();

// attempt to populate the user, but only care about failing
userStore.populateUser().catch(() => {
  router.push('/login');
});

</script>

<template>
  <BannerContainer />
  <div class="application">
    <div class="logo self-center p-2">
      <TrackbearMasthead />
    </div>
    <div class="side">
      <SideBar />
    </div>
    <div class="bar">
      <AppBar
        :breadcrumbs="props.breadcrumbs"
      />
    </div>
    <div class="main p-2 pr-4">
      <slot />
    </div>
  </div>
  <div class="log-progress-button fixed bottom-8 right-8">
    <LogProgressButton />
  </div>
</template>

<style scoped>
.application {
  display: grid;
  grid-template:
    "logo bar"
    "side main" 1fr
    / 16rem 1fr
  ;

  height: 100vh;

}

.logo {
  grid-area: logo;
}

.side {
  grid-area: side;

  overflow: scroll;
}

.logo, .side {
  /* border-right: 1px solid black; */
}

.bar {
  grid-area: bar;
}

.main {
  grid-area: main;
  overflow: scroll;
}

</style>
