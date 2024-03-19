<script setup lang="ts">
import TrackbearMasthead from './TrackbearMasthead.vue';
</script>

<template>
  <footer
    class="pt-6 pb-6 px-2 flex flex-col gap-4 md:gap-0"
  >
    <div class="links flex flex-col md:flex-row justify-start items-center items-baseline md:gap-2 text-sm">
      <TrackbearMasthead
        hide-logo
        hide-stage
      />
      <div>
        is made with 🐻 by <a
          href="https://github.com/dispatchrabbi"
          target="_blank"
        >@dispatchrabbi</a>.
      </div>
    </div>
    <div class="links flex flex-col md:flex-row flex-wrap md:justify-start md:items-baseline md:gap-2 text-sm">
      <div>
        <RouterLink to="/">
          Home
        </RouterLink>
      </div>
      <div class="hidden md:block">
        /
      </div>
      <div>
        <RouterLink to="/about">
          About
        </RouterLink>
      </div>
      <div class="hidden md:block">
        /
      </div>
      <div>
        <RouterLink to="/changelog">
          Changelog
        </RouterLink>
      </div>
      <div class="hidden md:block">
        /
      </div>
      <div>
        <RouterLink to="/privacy">
          Privacy
        </RouterLink>
      </div>
      <div class="hidden md:block">
        /
      </div>
      <div>
        <RouterLink to="/contact">
          Contact
        </RouterLink>
      </div>
      <div class="hidden md:block">
        /
      </div>
      <div>
        <a
          href="https://ko-fi.com/trackbear"
          target="_blank"
        >
          ☕️ Buy me a coffee!
        </a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
</style>
