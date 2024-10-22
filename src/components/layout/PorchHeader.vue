<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import Button from 'primevue/button';
import TrackbearMasthead from './TrackbearMasthead.vue';

onMounted(() => {
  userStore.populate();
})

</script>

<template>
  <div class="porch-header flex gap-2 items-center justify-between p-2">
    <TrackbearMasthead
      :link-to="userStore.user ? 'dashboard' : 'home'"
    />
    <div class="porch-header-buttons space-x-2 md:space-x-4">
      <RouterLink
        v-if="!userStore.user"
        :to="{ name: 'signup' }"
      >
        <Button
          label="Sign Up"
          outlined
        />
      </RouterLink>
      <RouterLink
        v-if="!userStore.user"
        :to="{ name: 'login' }"
      >
        <Button label="Log In" />
      </RouterLink>
      <RouterLink
        v-if="userStore.user"
        :to="{ name: 'dashboard' }"
      >
        <Button
          label="Back to the Dashboard"
          outlined
        />
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>

</style>
