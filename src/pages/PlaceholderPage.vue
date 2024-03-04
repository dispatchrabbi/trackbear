<script setup lang="ts">

defineProps<{ title: string }>();

</script>

<template>
  <PorchLayout>
    <SectionTitle :title="title" />
  </PorchLayout>
</template>

<style scoped>
</style>
