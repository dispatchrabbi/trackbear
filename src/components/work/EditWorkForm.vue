<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';
import { toTitleCase } from 'src/lib/str.ts';

import { z } from 'zod';
import { NonEmptyArray } from 'server/lib/validators.ts';
import { useValidation } from 'src/lib/form.ts';

import { updateWork, Work, WorkUpdatePayload } from 'src/lib/api/work.ts';
import { WORK_PHASE } from 'server/lib/models/work.ts';

import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const props = defineProps<{
  work: Work;
}>();
const emit = defineEmits(['work:edit', 'formSuccess']);

const formModel = reactive({
  title: props.work.title,
  description: props.work.description,
  phase: props.work.phase,
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
    const updatedWork = await updateWork(props.work.id, data as WorkUpdatePayload);

    emit('work:edit', { work: updatedWork });
    successMessage.value = `${updatedWork.title} has been edited.`;
    await wait(1 * 1000);
    emit('formSuccess');
  } catch(err) {
    errorMessage.value = 'Could not edit the project: something went wrong server-side.';

    return;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <TbForm
    :is-valid="isValid"
    submit-message="Edit"
    :loading-message="isLoading ? 'Editing...' : null"
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
server/lib/models/work
