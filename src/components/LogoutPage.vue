<script setup lang="ts">
import { ref } from 'vue';

import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from '../stores/user.ts';
const userStore = useUserStore();

import AppPage from './layout/AppPage.vue';
import ContentHeader from 'src/components/layout/ContentHeader.vue';

const logOutError = ref(false);

userStore.logOut().then(() => {
  router.push('/');
}).catch(() => {
  logOutError.value = true;
});

</script>

<template>
  <AppPage require-login>
    <ContentHeader title="Logging out..." />
    <VaAlert
      v-if="logOutError"
      color="warning"
    >
      There was an error logging out. <RouterLink to="/">
        Click here
      </RouterLink> to go to the homepage.
    </VaAlert>
  </AppPage>
</template>

<style scoped>
a {
  text-decoration: underline;
}
</style>
