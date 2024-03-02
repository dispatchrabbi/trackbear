<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

import Button from 'primevue/button';

import TrackbearMasthead from './TrackbearMasthead.vue';
// TODO: restore the dark mode toggle
// import DarkModeToggle from './DarkModeToggle.vue';

</script>

<template>
  <div class="porch-header flex gap-2 items-center justify-between p-2">
    <TrackbearMasthead />
    <div class="porch-header-buttons space-x-2">
      <Button
        label="Sign Up"
        outlined
      />
      <Button label="Log In" />
    </div>
  </div>
</template>

<style scoped>

</style>
