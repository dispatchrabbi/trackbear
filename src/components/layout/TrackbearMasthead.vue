<script setup lang="ts">
import { defineProps } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps<{
  hideLogo?: boolean;
  hideStage?: boolean;
  linkTo?: string;
}>();

</script>

<template>
  <RouterLink :to="{ name: linkTo ?? 'home' }">
    <div :class="['masthead flex gap-1 items-center text-2xl leading-1 font-heading font-black']">
      <div
        v-if="!props.hideLogo"
        class="logo flex-none"
      >
        <img :src="`/images/brown-bear.png`">
      </div>
      <div class="app-name mt-1">
        <span class="uppercase">TrackBear</span><span
          v-if="!props.hideStage"
          class="disclaimer text-sm text-primary-500 dark:text-primary-400"
        >BETA</span>
      </div>
    </div>
  </RouterLink>
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
