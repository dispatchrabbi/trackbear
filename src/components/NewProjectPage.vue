<script setup lang="ts">
import { ref, reactive } from 'vue';

import { z } from 'zod';
import { zStrInt } from '../../server/lib/validators.ts';
import { useValidation } from '../lib/form.ts';

import { useRouter } from 'vue-router';
const router = useRouter();

import AppPage from './layout/AppPage.vue';
import { TYPE_INFO } from '../lib/project.ts';
import { createProject } from '../lib/api/project.ts';
import type { CreateProjectPayload } from '../../server/api/projects.ts';
import { parseDateStringSafe, formatDate } from '../lib/date.ts';

const formModel = reactive({
  title: '',
  type: 'words',
  goal: '',
  startDate: null,
  endDate: null,
});

const validations = z.object({
  title: z.string().min(1, { message: 'Please choose a name for your project.'}),
  type: z.enum(Object.keys(TYPE_INFO) as [string, ...string[]]),
  goal: z.union([
    zStrInt({ message: 'Goal must be a whole number' }),
    z.string().length(0).transform(() => null)
  ]),
  startDate: z.date().transform(formatDate).nullable(),
  endDate: z.date().transform(formatDate).nullable(),
});

const { formData, validate, isValid, ruleFor } = useValidation(validations, formModel);

const typeOptions = Object.keys(TYPE_INFO).map(type => ({ text: TYPE_INFO[type].count, value: type }));

const isLoading = ref<boolean>(false);
const errorMessage = ref<string>('');

async function handleSubmit() {
  isLoading.value = true;
  errorMessage.value = '';

  const payload = {
    ...formData(),
    visibility: 'private'
  } as CreateProjectPayload;

  try {
    await createProject(payload);
  } catch(err) {
    errorMessage.value = err;
    return;
  } finally {
    isLoading.value = false;
  }

  router.push('/projects');
}

function handleCancel() {
  router.push('/projects');
}

</script>

<template>
  <AppPage require-login>
    <h2 class="va-h2 mb-3">
      New Project
    </h2>
    <VaCard>
      <VaCardContent>
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
              <span class="required-mark"> * </span>
            </label>
            <VaRadio
              v-model="formModel.type"
              :options="typeOptions"
              text-by="text"
              value-by="value"
              vertical
            />
          </div>
          <VaInput
            v-model="formModel.goal"
            :label="formModel.type === 'time' ? 'Goal (in hours)' : 'Goal'"
            :rules="[ ruleFor('goal') ]"
            messages="If you add a goal, the project will track progress toward that goal."
          />
          <VaDateInput
            v-model="formModel.startDate"
            label="Start Date"
            placeholder="YYYY-MM-DD"
            messages="If you don't provide a start date, the project will start when you log your first bit of progress."
            :format="formatDate"
            :parse="parseDateStringSafe"
            manual-input
            clearable
          />
          <VaDateInput
            v-model="formModel.endDate"
            label="End Date"
            messages="If you provide an end date along with your goal, the project will track progress toward your deadline. Combined with a goal, the project will also track you against par."
            placeholder="YYYY-MM-DD"
            :format="formatDate"
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
