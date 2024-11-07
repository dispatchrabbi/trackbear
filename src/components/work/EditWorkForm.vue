<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';
import { toTitleCase } from 'src/lib/str.ts';

import { z } from 'zod';
import { NonEmptyArray } from 'server/lib/validators.ts';
import { useValidation } from 'src/lib/form.ts';

import { updateWork, Work, WorkUpdatePayload } from 'src/lib/api/work.ts';
import { WORK_PHASE } from 'server/lib/models/work.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import InputText from 'primevue/inputtext';
import InputSwitch from 'primevue/inputswitch';
import Dropdown from 'primevue/dropdown';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
import MultiMeasureInput from 'src/components/work/MultiMeasureInput.vue';

const props = defineProps<{
  work: Work;
}>();
const emit = defineEmits(['work:edit', 'formSuccess']);

const formModel = reactive({
  title: props.work.title,
  description: props.work.description,
  displayOnProfile: props.work.displayOnProfile,

  phase: props.work.phase,
  startingBalance: props.work.startingBalance,
});

const validations = z.object({
  title: z.string().min(1, { message: 'Please enter a title.'}),
  description: z.string(),
  displayOnProfile: z.boolean(),
  phase: z.enum(Object.values(WORK_PHASE) as NonEmptyArray<typeof WORK_PHASE[keyof typeof WORK_PHASE]>, { required_error: 'Please pick a phase.'}),
  startingBalance: z.record(
    z.enum(Object.keys(TALLY_MEASURE_INFO) as NonEmptyArray<string>),
    z.number({ invalid_type_error: 'Please fill in all balances, or remove blank rows.' }).int({ message: 'Please only enter whole numbers.' })
  ),
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
  } catch {
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
      for="work-form-display-on-profile"
      label="Show on Profile?"
      :rule="ruleFor('displayOnProfile')"
      help="This only takes effect if you have enabled your public profile in Settings."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="flex gap-4 max-w-full items-center">
          <InputSwitch
            v-model="formModel.displayOnProfile"
            :invalid="!isFieldValid"
            @update:model-value="onUpdate"
          />
          <div
            class="max-w-64 md:max-w-none"
          >
            This project <b>{{ formModel.displayOnProfile ? 'will' : `will not` }}</b> be shown on your profile.
          </div>
        </div>
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="work-form-phase"
      label="Phase"
      required
      :rule="ruleFor('phase')"
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
    <FieldWrapper
      for="work-form-starting-balance"
      label="Starting Balance"
      :rule="ruleFor('startingBalance')"
      help="Starting balances will be counted in totals but don't count as activity."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <MultiMeasureInput
          id="work-form-starting-balance"
          v-model="formModel.startingBalance"
          :invalid="!isFieldValid"
          add-button-text="Add Starting Balance"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
server/lib/models/work
