<script setup lang="ts">

import { useBannerStore } from '../../stores/banner.ts';
const bannerStore = useBannerStore();

import AnnouncementBanner from './AnnouncementBanner.vue';
function handleClose(uuid) {
  bannerStore.closeBanner(uuid);
}

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
