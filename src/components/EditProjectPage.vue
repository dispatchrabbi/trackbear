<script setup lang="ts">
import { ref, reactive } from 'vue';

import { z } from 'zod';
import { zStrInt } from '../../server/lib/validators.ts';
import { useValidation } from '../lib/form.ts';

import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();

import { getProject } from '../lib/api/project.ts';

import AppPage from './layout/AppPage.vue';
import { Project, TYPE_INFO } from '../lib/project.ts';
import { editProject } from '../lib/api/project.ts';
import type { EditProjectPayload } from '../../server/api/projects.ts';
import { parseDateStringSafe, formatDateSafe } from '../lib/date.ts';

const formModel = reactive({
  title: '',
  goal: '',
  startDate: null,
  endDate: null,
});

const validations = z.object({
  title: z.string().min(1, { message: 'Please choose a name for your project.'}),
  goal: z.union([
    zStrInt({ message: 'Goal must be a whole number' }),
    z.string().length(0).transform(() => null)
  ]),
  startDate: z.date().nullish().transform(formatDateSafe),
  endDate: z.date().nullish().transform(formatDateSafe),
});

const { formData, validate, isValid, ruleFor } = useValidation(validations, formModel);

const typeOptions = Object.keys(TYPE_INFO).map(type => ({ text: TYPE_INFO[type].description, value: type }));

const isLoading = ref<boolean>(false);
const errorMessage = ref<string>('');

const project = ref<Project>(null);
function loadProject() {
  isLoading.value = true;

  const projectIdStr = route.params.id as string;
  if(Number.parseInt(projectIdStr, 10) !== +projectIdStr) {
    router.push('/projects');
    return;
  }

  const projectId = +projectIdStr;
  getProject(projectId)
    .then(p => {
      formModel.title = p.title;
      formModel.goal = p.goal === null ? '' : p.goal.toString(10);
      formModel.startDate = parseDateStringSafe(p.startDate);
      formModel.endDate = parseDateStringSafe(p.endDate);

      project.value = p;
    })
    .catch(err => {
      if(err.code === 'NOT_FOUND') {
        errorMessage.value = `Could not find project with ID ${projectId}. How did you get here?`;
      } else {
        errorMessage.value = err.message;
      }
    }).finally(() => {
      isLoading.value = false;
    });
}
loadProject();

async function handleSubmit() {
  isLoading.value = true;
  errorMessage.value = '';

  const payload = {
    ...formData(),
    visibility: 'private'
  } as EditProjectPayload;

  try {
    await editProject(project.value.id, payload);
  } catch(err) {
    errorMessage.value = err;
    return;
  } finally {
    isLoading.value = false;
  }

  router.push({ name: 'project', params: { id: project.value.id }});
}

function handleCancel() {
  router.push({ name: 'project', params: { id: project.value.id }});
}

</script>

<template>
  <AppPage require-login>
    <h2 class="va-h2 mb-3">
      Edit Project
    </h2>
    <VaCard>
      <VaCardContent v-if="project">
        <VaAlert
          v-if="errorMessage"
          class="mb-4"
          color="danger"
          border="left"
          icon="error"
          closeable
          :description="errorMessage"
        />
        <VaForm
          ref="form"
          class="flex flex-col gap-4"
          tag="form"
          @submit.prevent="validate() && handleSubmit()"
        >
          <VaInput
            v-model="formModel.title"
            label="Title"
            :rules="[ ruleFor('title') ]"
            required-mark
          />
          <div>
            <label
              aria-hidden="true"
              class="va-input-label va-input-wrapper__label va-input-wrapper__label--outer"
              style="color: var(--va-primary);"
            >
              What to track
            </label>
            <VaRadio
              v-model="project.type"
              :options="typeOptions.filter(option => option.value === project.type)"
              text-by="text"
              value-by="value"
              vertical
              readonly
              disabled
            />
          </div>
          <VaInput
            v-model="formModel.goal"
            :label="project.type === 'time' ? 'Goal (in hours)' : 'Goal'"
            :rules="[ ruleFor('goal') ]"
            messages="If you add a goal, the project will track progress toward that goal."
          />
          <VaDateInput
            v-model="formModel.startDate"
            label="Start Date"
            placeholder="YYYY-MM-DD"
            messages="If you don't provide a start date, the project will start when you log your first bit of progress."
            :format="formatDateSafe"
            :parse="parseDateStringSafe"
            manual-input
            clearable
          />
          <VaDateInput
            v-model="formModel.endDate"
            label="End Date"
            messages="If you provide an end date along with your goal, the project will track progress toward your deadline. Combined with a goal, the project will also track you against par."
            placeholder="YYYY-MM-DD"
            :format="formatDateSafe"
            :parse="parseDateStringSafe"
            manual-input
            clearable
          />
          <div class="flex gap-4 mt-4">
            <VaButton
              :disabled="!isValid"
              :loading="isLoading"
              type="submit"
            >
              Save
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
  </AppPage>
</template>

<style scoped>
.required-mark {
  transform: translate(0, -2px);
  color: var(--va-danger);
  font-size: 18px;
  font-weight: var(--va-input-container-label-font-weight);
  vertical-align: middle;
}
</style>
../lib/form.ts
