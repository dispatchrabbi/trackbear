<script setup lang="ts">

const props = defineProps<{
  title: string;
}>();

</script>

<template>
  <div class="flex gap-4 items-center">
    <h3 class="va-h3 mb-3 content-title">
      {{ props.title }}
    </h3>
    <slot name="actions" />
  </div>
</template>

<style scoped>
.content-title ~ :deep(*) {
  display: block;
  @apply flex-initial;
}
</style>
