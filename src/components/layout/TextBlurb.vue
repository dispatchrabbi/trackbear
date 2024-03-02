<script setup lang="ts">

import SectionTitle from './SectionTitle.vue';

const props = defineProps<{
  title?: string;
}>();

</script>

<template>
  <div class="blurb p-4 max-w-5xl mx-auto mt-4">
    <SectionTitle
      v-if="props.title"
      :title="props.title"
    />
    <div class="blurb-text mt-3 space-y-3">
      <slot />
    </div>
  </div>
</template>

<style scoped>

</style>
