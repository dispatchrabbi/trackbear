<script setup lang="ts">
import { RouterLink } from 'vue-router';

import Button from 'primevue/button';

import TrackbearMasthead from './TrackbearMasthead.vue';
// TODO: restore the dark mode toggle
// import DarkModeToggle from './DarkModeToggle.vue';

</script>

<template>
  <div class="porch-header flex gap-2 items-center justify-between p-2">
    <TrackbearMasthead />
    <div class="porch-header-buttons space-x-2">
      <RouterLink to="/signup">
        <Button
          label="Sign Up"
          outlined
        />
      </RouterLink>
      <RouterLink to="/login">
        <Button label="Log In" />
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>

</style>
