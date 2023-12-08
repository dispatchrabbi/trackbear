<script setup lang="ts">
import { ref } from 'vue';
import type { Project } from '../lib/project.ts';
import ProjectTile from './ProjectTile.vue';

// defineProps<{ projects: Project[] }>();
const SAMPLE_PROJECTS = [
  { id: 4, title: "Romance a.k.a. Smut" },
  { id: 2, title: 'An English Prof Has A Mid-Life Crisis'},
  { id: 3, title: 'Harry/Draco But In Space' },
  { id: 1, title: 'Great American Novel' },
  { id: 5, title: "My Poetry Collection" },
]

</script>

<template>
  <div class="flex items-center mb-3">
    <div class="grow">
      <h2 class="va-h2">Your Projects</h2>
    </div>
    <div class="shrink">
      <VaButton>New Project</VaButton>
    </div>
  </div>
  <div class="grid grid-cols-2 gap-4">
    <div
      v-for="project in SAMPLE_PROJECTS"
      :key="project.id"
    >
      <ProjectTile
        :project="project"
      ></ProjectTile>
    </div>
  </div>
</template>

<style scoped>
</style>
