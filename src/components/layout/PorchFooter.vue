<script setup lang="ts">
import TrackbearMasthead from './TrackbearMasthead.vue';
</script>

<template>
  <footer
    class="pt-6 pb-6 px-2 flex flex-col"
  >
    <div class="links flex justify-start items-center md:items-baseline gap-2 text-sm">
      <TrackbearMasthead hide-logo hide-stage />
      <div>
        is made with 🐻 by <a
          href="https://github.com/dispatchrabbi"
          target="_blank"
        >@dispatchrabbi</a>.
      </div>
    </div>
    <div class="links flex justify-start items-baseline gap-2 text-sm">
      <div>
        <RouterLink to="/">
          Home
        </RouterLink>
      </div>
      <div>/</div>
      <div>
        <RouterLink to="/about">
          About
        </RouterLink>
      </div>
      <div>/</div>
      <div>
        <RouterLink to="/changelog">
          Changelog
        </RouterLink>
      </div>
      <div>/</div>
      <div>
        <RouterLink to="/privacy">
          Privacy
        </RouterLink>
      </div>
      <!-- <div>/</div>
      <div>
        <RouterLink to="/ko-fi">
          Buy me a coffee
        </RouterLink>
      </div> -->
    </div>
  </footer>
</template>

<style scoped>
</style>
