<script setup lang="ts">
</script>

<template>
  <div class="masthead flex gap-1 text-2xl p-2 font-heading">
    <div class="logo flex-none">
      <img :src="`/images/brown-bear.png`">
    </div>
    <div class="app-name">
      <span class="uppercase">TrackBear</span><span class="disclaimer text-sm text-red-500">alpha</span>
    </div>
  </div>
</template>

<style scoped>
.logo > img {
  height: 1em; /* not rem! */
  aspect-ratio: 1;
}
.disclaimer {
  position: relative;
  top: -0.5rem;
}
</style>
