<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
  hideLogo?: boolean;
  hideStage?: boolean;
  collapsed?: boolean;
}>();

</script>

<template>
  <div :class="['masthead flex gap-1 items-center text-2xl leading-1 font-heading font-black', props.collapsed ? 'justify-center' : null ]">
    <div
      v-if="!props.hideLogo"
      class="logo flex-none"
    >
      <img :src="`/images/brown-bear.png`">
    </div>
    <div
      v-if="!props.collapsed"
      class="app-name mt-1"
    >
      <span class="uppercase">TrackBear</span><span
        v-if="!props.hideStage"
        class="disclaimer text-sm text-indigo-500 dark:text-indigo-400"
      >BETA</span>
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
