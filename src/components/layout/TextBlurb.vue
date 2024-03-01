<script setup lang="ts">

const props = defineProps<{
  title?: string;
}>();

</script>

<template>
  <div class="blurb p-4 max-w-5xl mx-auto mt-4">
    <h1
      v-if="props.title"
      class="blurb-title text-xl font-semibold font-heading uppercase"
    >
      {{ props.title }}
    </h1>
    <div class="blurb-text mt-3 space-y-3">
      <slot />
    </div>
  </div>
</template>

<style scoped>

</style>
