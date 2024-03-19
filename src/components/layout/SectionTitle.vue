<script setup lang="ts">

const props = defineProps<{
  title: string;
  subtitle?: string;
}>();

</script>

<template>
  <header>
    <h1 class="text-2xl font-bold font-heading text-balance">
      {{ props.title }}
    </h1>
    <h2
      v-if="props.subtitle"
      class="font-heading italic font-light text-balance"
    >
      {{ props.subtitle }}
    </h2>
  </header>
</template>

<style scoped>

</style>
