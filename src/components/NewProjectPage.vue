<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import LoggedInAppPage from './layout/LoggedInAppPage.vue';

const router = useRouter();
function returnToProjects() {
  router.push('/projects');
}

const projectType = ref(null);

</script>

<template>
  <LoggedInAppPage>
    <h2 class="va-h2 mb-3">
      New Project
    </h2>
    <VaCard>
      <VaCardContent>
        <VaForm class="flex flex-col gap-4">
          <VaInput
            label="Title"
          />
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
          />
          <VaDateInput
            label="Start Date"
          />
          <VaDateInput
            label="End Date"
          />

          <div class="flex gap-4 mt-4">
            <VaButton>Create</VaButton>
            <VaButton
              preset="secondary"
              border-color="primary"
              @click="returnToProjects"
            >
              Cancel
            </VaButton>
          </div>
        </VaForm>
      </VaCardContent>
    </VaCard>
  </LoggedInAppPage>
</template>

<style scoped>
</style>
