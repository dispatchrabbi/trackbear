<script setup lang="ts">
import { defineProps } from 'vue';
import { boolean } from 'zod';

const props = defineProps<{
  hideLogo?: boolean;
  hideStage?: boolean;
}>();

</script>

<template>
  <div class="masthead flex gap-1 items-center text-2xl leading-1 font-heading font-black">
    <div
      v-if="!props.hideLogo"
      class="logo flex-none"
    >
      <img :src="`/images/brown-bear.png`">
    </div>
    <div class="app-name mt-1">
      <span class="uppercase">TrackBear</span><span
        v-if="!props.hideStage"
        class="disclaimer text-sm font-light text-red-500"
      >alpha</span>
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
