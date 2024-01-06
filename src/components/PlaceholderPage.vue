<script setup lang="ts">

import AppPage from './layout/AppPage.vue';
import ContentHeader from 'src/components/layout/ContentHeader.vue';

defineProps<{ title: string }>();

</script>

<template>
  <AppPage>
    <ContentHeader :title="title" />
  </AppPage>
</template>

<style scoped>
</style>
