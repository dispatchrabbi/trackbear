<script setup lang="ts">

const props = defineProps<{
  title: string;
}>();

</script>

<template>
  <div class="flex gap-4 items-center">
    <h3 class="va-h3 mb-3 flex-auto content-title">
      {{ props.title }}
    </h3>
    <slot name="actions" />
  </div>
</template>

<style scoped>
.content-title ~ :deep(*) {
  display: block;
  /* all top-level elements in the #actions slot should be flex-initial */
  @apply flex-initial;
}
</style>
