<script setup lang="ts">
import { ref, reactive, computed, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';
import { toTitleCase } from 'src/lib/str';

import { z } from 'zod';
import { NonEmptyArray } from 'server/lib/validators.ts';
import { useValidation } from 'src/lib/form.ts';

import { createWork, WorkPayload } from 'src/lib/api/work.ts';
import { WORK_PHASE } from 'server/lib/entities/work';

import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const emit = defineEmits(['work:create', 'requestClose']);

const formModel = reactive({
  title: '',
  description: '',
  phase: WORK_PHASE.DRAFTING,
});

const validations = z.object({
  title: z.string().min(1, { message: 'Please enter a title.'}),
  description: z.string(),
  phase: z.enum(Object.values(WORK_PHASE) as NonEmptyArray<typeof WORK_PHASE[keyof typeof WORK_PHASE]>, { required_error: 'Please pick a phase.'}),
});

const { ruleFor, validate, isValid, formData } = useValidation(validations, formModel);

const phaseOptions = computed(() => {
  return Object.keys(WORK_PHASE).map(key => ({
    label: toTitleCase(WORK_PHASE[key]),
    value: WORK_PHASE[key],
  }));
});

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const data = formData();
    const createdWork = await createWork(data as WorkPayload);

    emit('work:create', { work: createdWork });
    successMessage.value = `${createdWork.title} has been created.`;
    await wait(1 * 1000);
    emit('requestClose');
  } catch(err) {
    errorMessage.value = 'Could not create the project: something went wrong server-side.';

    return;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <TbForm
    :is-valid="isValid"
    submit-message="Submit"
    :loading-message="isLoading ? 'Creating...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <FieldWrapper
      for="work-form-title"
      label="Title"
      required
      :rule="ruleFor('title')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="work-form-title"
          v-model="formModel.title"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="work-form-description"
      label="Description"
      :rule="ruleFor('description')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="work-form-description"
          v-model="formModel.description"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="work-form-phase"
      label="Phase"
      required
      :rule="ruleFor('phase')"
      help="This doesn't do anything yet. You can still set it though!"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <Dropdown
          id="work-form-phase"
          v-model="formModel.phase"
          :options="phaseOptions"
          option-label="label"
          option-value="value"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
