<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from '../../stores/user.ts';
const userStore = useUserStore();

import BannerContainer from '../banner/BannerContainer.vue';
import PageHeader from './PageHeader.vue';
import PageBody from './PageBody.vue';
import PageFooter from './PageFooter.vue';

const props = defineProps<{
  requireLogin?: boolean;
}>();

// attempt to populate the user, but only care about failing if we require being logged in
userStore.populate().catch(() => {
  if(props.requireLogin) {
    router.push('/login');
  }
});

</script>

<template>
  <BannerContainer v-if="userStore.user" />
  <PageHeader />
  <PageBody>
    <slot />
  </PageBody>
  <PageFooter />
</template>
