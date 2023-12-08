<script setup lang="ts">
import { ref } from 'vue';
import type { Project } from '../lib/project.ts';

// defineProps<{ projects: Project[] }>();
const projectType = ref(null);

</script>

<template>
  <h2 class="va-h2 mb-3">New Project</h2>
  <VaCard>
    <VaCardContent>
      <VaForm class="flex flex-col gap-4">
        <VaInput
          label="Title"
        ></VaInput>
        <div>
          <span class="va-title va-text-primary">Type</span>
          <VaOptionList
            v-model="projectType"
            type="radio"
            :options="['Words', 'Pages', 'Chapters', 'Time Spent']"
          />
        </div>
        <VaInput
          label="Goal"
        ></VaInput>
        <VaDateInput
          label="Start Date"
        ></VaDateInput>
        <VaDateInput
          label="End Date"
        ></VaDateInput>

        <div class="flex gap-4 mt-4">
          <VaButton>Create</VaButton>
          <VaButton
            preset="secondary"
            border-color="primary"
          >Cancel</VaButton>
        </div>
      </VaForm>
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
