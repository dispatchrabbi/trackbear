<script setup lang="ts">

import SectionTitle from './SectionTitle.vue';

const props = withDefaults(defineProps<{
  title?: string;
  autoSpace?: boolean;
}>(), {
  title: '',
  autoSpace: true,
});

</script>

<template>
  <div class="blurb p-4 max-w-screen-lg mx-auto mt-4">
    <SectionTitle
      v-if="props.title"
      :title="props.title"
    />
    <div
      :class="{
        'blurb-text': true,
        'mt-3': true,
        'space-y-3': props.autoSpace
      }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>

</style>
