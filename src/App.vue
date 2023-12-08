<script setup lang="ts">
import PageHeader from './components/PageHeader.vue';
import PageBody from './components/PageBody.vue';
import ProjectPage from './components/project/ProjectPage.vue';

import SAMPLE_PROJECT from './fixtures/project.ts';
import ProjectListPage from './components/ProjectListPage.vue';
import NewProjectPage from './components/NewProjectPage.vue';
</script>

<template>
  <PageHeader></PageHeader>
  <PageBody>
    <ProjectPage :project="SAMPLE_PROJECT"></ProjectPage>
    <!-- <ProjectListPage></ProjectListPage> -->
    <!-- <NewProjectPage></NewProjectPage> -->
  </PageBody>
</template>

<style scoped>

</style>
