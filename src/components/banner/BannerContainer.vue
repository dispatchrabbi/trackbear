<script setup lang="ts">
import { computed } from 'vue';

import { useBannerStore } from '../../stores/banner.ts';
const bannerStore = useBannerStore();

import AnnouncementBanner from './AnnouncementBanner.vue';
function handleClose(uuid) {
  bannerStore.closeBanner(uuid);
}

// const availableBanners = computed(() => {
//   return bannerStore.availableBanners;
// });

bannerStore.populateBanners();
</script>

<template>
  <AnnouncementBanner
    v-for="banner of bannerStore.availableBanners"
    :key="banner.uuid"
    :message="banner.message"
    :icon="banner.icon"
    :color="banner.color"
    @close="handleClose(banner.uuid)"
  />
</template>
