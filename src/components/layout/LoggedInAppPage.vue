<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from '../../stores/user.ts';
const userStore = useUserStore();

import AppPage from './AppPage.vue';

userStore.populateUser().catch(() => {
  router.push('/login');
});

</script>

<template>
  <AppPage>
    <slot v-if="userStore.user" />
  </AppPage>
</template>
