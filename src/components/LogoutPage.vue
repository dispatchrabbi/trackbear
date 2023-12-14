<script setup lang="ts">
import { ref } from 'vue';

import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from '../stores/user';
const userStore = useUserStore();

import LoggedInAppPage from './layout/LoggedInAppPage.vue';

const logOutError = ref(false);

userStore.logOut().then(() => {
  router.push('/');
}).catch(err => {
  console.error(err);
  logOutError.value = true;
});

</script>

<template>
  <LoggedInAppPage>
    <h2 class="va-h2 mb-3">
      Logging Out...
    </h2>
    <VaAlert
      v-if="logOutError"
      color="warning"
    >
      There was an error logging out. <RouterLink to="/">Click here</RouterLink> to go to the homepage.
    </VaAlert>
  </LoggedInAppPage>
</template>

<style scoped>
a {
  text-decoration: underline;
}
</style>
