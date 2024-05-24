<script setup lang="ts">

const props = defineProps<{
  title: string;
}>();

</script>

<template>
  <header>
    <h2 class="text-xl font-bold font-heading text-balance">
      {{ props.title }}
    </h2>
  </header>
</template>

<style scoped>

</style>
