<script setup lang="ts">
import { ref, reactive, computed } from 'vue';

import { useRouter } from 'vue-router';
const router = useRouter();

import LoggedInAppPage from './layout/LoggedInAppPage.vue';
import { createProject } from '../lib/api/project';
import { CreateProjectPayload } from '../../server/api/projects';
import { parseDateStringSafe, formatDate } from '../lib/date.ts';

const projectForm = reactive({
  title: '',
  projectType: 'words',
  goal: '',
  startDate: null,
  endDate: null,
});

const errorMessage = ref('');

const typeOptions = [
  { text: 'Words', value: 'words' },
  { text: 'Time', value: 'time' },
  { text: 'Chapters', value: 'chapters' },
  { text: 'Pages', value: 'pages' },
];

// not sure why useForm()'s validate and isValid aren't working but oh well
function validate() {
  const titleIsValid = projectForm.title?.length > 0;
  const typeIsValid = typeOptions.map(option => option.value).includes(projectForm.projectType);
  const goalIsValid = projectForm.goal === '' || Number.isInteger(+projectForm.goal);
  const startDateIsValid = projectForm.startDate === null || projectForm.startDate instanceof Date;
  const endDateIsValid = projectForm.endDate === null || projectForm.endDate instanceof Date;

  return titleIsValid && typeIsValid && goalIsValid && startDateIsValid && endDateIsValid;
}
const isValid = computed(() => validate());

async function handleSubmit() {
  errorMessage.value = '';

  const formData = {
    title: projectForm.title,
    type: projectForm.projectType,
    goal: projectForm.goal === '' ? null : +projectForm.goal,
    startDate: projectForm.startDate === null ? null : formatDate(projectForm.startDate),
    endDate: projectForm.endDate === null ? null : formatDate(projectForm.endDate),
    visibility: 'private',
  } as CreateProjectPayload;

  try {
    await createProject(formData);
  } catch(err) {
    // TODO: better error handling here
    errorMessage.value = err;
    return;
  }

  router.push('/projects');
}

function handleCancel() {
  router.push('/projects');
}

</script>

<template>
  <LoggedInAppPage>
    <h2 class="va-h2 mb-3">
      New Project
    </h2>
    <VaCard>
      <VaCardContent>
        <VaForm
          ref="form"
          class="flex flex-col gap-4"
          tag="form"
          @submit.prevent="validate() && handleSubmit()"
        >
          <VaInput
            v-model="projectForm.title"
            label="Title"
            messages="Required"
            :rules="[v => !!v || 'Please enter a title']"
          />
          <div>
            <label
              aria-hidden="true"
              class="va-input-label va-input-wrapper__label va-input-wrapper__label--outer"
              style="color: var(--va-primary);"
            >What to track</label>
            <VaRadio
              v-model="projectForm.projectType"
              messages="Required"
              :options="typeOptions"
              text-by="text"
              value-by="value"
              vertical
            />
          </div>
          <VaInput
            v-model="projectForm.goal"
            :label="projectForm.projectType === 'time' ? 'Goal (in hours)' : 'Goal'"
            :rules="[v => { return (v === '') || (Number.parseInt(v, 10) === +v) || ('Please enter a number for your goal') }]"
          />
          <VaDateInput
            v-model="projectForm.startDate"
            label="Start Date"
            placeholder="YYYY-MM-DD"
            :format="formatDate"
            :parse="parseDateStringSafe"
            manual-input
            clearable
          />
          <VaDateInput
            v-model="projectForm.endDate"
            label="End Date"
            placeholder="YYYY-MM-DD"
            :format="formatDate"
            :parse="parseDateStringSafe"
            manual-input
            clearable
          />

          <p v-if="errorMessage">
            {{ errorMessage }}
          </p>
          <div class="flex gap-4 mt-4">
            <VaButton
              :disabled="!isValid"
              type="submit"
            >
              Create
            </VaButton>
            <VaButton
              preset="secondary"
              border-color="primary"
              @click="handleCancel"
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
