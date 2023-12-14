<script setup lang="ts">
import LoggedInAppPage from './layout/LoggedInAppPage.vue'
import ProjectTile from './project/ProjectTile.vue';

const SAMPLE_PROJECTS = [
  { id: 4, title: "Romance a.k.a. Smut" },
  { id: 2, title: 'An English Prof Has A Mid-Life Crisis'},
  { id: 3, title: 'Harry/Draco But In Space' },
  { id: 1, title: 'Great American Novel' },
  { id: 5, title: "My Poetry Collection" },
];

</script>

<template>
  <LoggedInAppPage>
    <div class="flex items-center mb-3">
      <div class="grow">
        <h2 class="va-h2">
          Your Projects
        </h2>
      </div>
      <div class="shrink">
        <RouterLink to="/projects/new">
          <VaButton>New Project</VaButton>
        </RouterLink>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div
        v-for="project in SAMPLE_PROJECTS"
        :key="project.id"
      >
        <ProjectTile
          :project="project"
        />
      </div>
    </div>
  </LoggedInAppPage>
</template>

<style scoped>
</style>
