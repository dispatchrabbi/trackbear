<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';
import { useEventBus } from '@vueuse/core';

import { useWorkStore } from 'src/stores/work.ts';
const workStore = useWorkStore();
workStore.populate();

import { useTagStore } from 'src/stores/tag.ts';
const tagStore = useTagStore();
tagStore.populate();

import { z } from 'zod';
import type { NonEmptyArray } from 'server/lib/validators.ts';
import { formatDateSafe, parseDateStringSafe } from 'src/lib/date.ts';
import { useValidation } from 'src/lib/form.ts';

import { updateTally, type Tally, type TallyUpdatePayload, type TallyWithTags } from 'src/lib/api/tally.ts';
import { TALLY_MEASURE, type TallyMeasure } from 'server/lib/models/tally/consts';
import { TALLY_MEASURE_INFO, formatCount } from 'src/lib/tally.ts';
import { cmpWorkByTitle } from 'src/lib/work';

const props = defineProps<{
  tally: TallyWithTags;
}>();

import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import TallyCountInput from './TallyCountInput.vue';
import InputSwitch from 'primevue/inputswitch';
import MultiSelect from 'primevue/multiselect';
import Textarea from 'primevue/textarea';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
// import TbTag from 'src/components/tag/TbTag.vue';

const emit = defineEmits(['tally:edit', 'formSuccess']);

const formModel = reactive({
  date: parseDateStringSafe(props.tally.date),
  workId: props.tally.workId,
  tags: props.tally.tags.map(tag => tag.name),
  count: props.tally.count,
  measure: props.tally.measure,
  setTotal: false,
  note: props.tally.note,
});

const MAXIMUM_NOTE_LENGTH = 140;

const validations = z.object({
  date: z.date({ invalid_type_error: 'Please select a date.' }).transform(formatDateSafe),
  workId: z.number({ invalid_type_error: 'Please select a project.' }).positive({ message: 'Please select a project.' }),
  tags: z.array(z.string()),
  count: z.number({ invalid_type_error: 'Please enter a value.' }).int({ message: 'Please enter a whole number.' }),
  measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<TallyMeasure>, { required_error: 'Please pick a type.' }),
  setTotal: z.boolean(),
  note: z.string().max(MAXIMUM_NOTE_LENGTH, { message: `Notes can be at most ${MAXIMUM_NOTE_LENGTH} characters.` }),
});

const { ruleFor, validate, isValid, formData } = useValidation(validations, formModel);

const workOptions = computed(() => {
  const options = workStore.nonDormantWorks;

  // if we're on a work's page and that work is dormant, it won't be an option, so we need to add it
  if(!options.find(work => work.id === formModel.workId)) {
    const selectedWork = workStore.allWorks.find(work => work.id === formModel.workId);
    if(selectedWork) {
      return [...options, selectedWork].sort(cmpWorkByTitle);
    }
  }

  return options;
});

const measureOptions = computed(() => {
  return Object.values(TALLY_MEASURE).map(measure => ({
    id: measure,
    label: TALLY_MEASURE_INFO[measure].label.plural,
  }));
});

const onMeasureChange = function() {
  formModel.count = null;
};

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const data = formData();
    const updated = await updateTally(props.tally.id, data as TallyUpdatePayload);

    emit('tally:edit', { tally: updated });
    const tallyEventBus = useEventBus<{ tally: Tally }>('tally:edit');
    tallyEventBus.emit({ tally: updated });

    successMessage.value = `Progress saved!`;

    await wait(1 * 1000);
    emit('formSuccess');
  } catch {
    errorMessage.value = 'Could not update your progress: something went wrong server-side.';

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
    :loading-message="isLoading ? 'Updating...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <FieldWrapper
      for="tally-form-date"
      label="Date"
      :required="true"
      :rule="ruleFor('date')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <!-- yy-mm-dd looks incorrect but here, yy is for four digits -->
        <Calendar
          id="tally-form-date"
          v-model="formModel.date"
          placeholder="yyyy-mm-dd"
          date-format="yy-mm-dd"
          show-icon
          show-button-bar
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="tally-form-work"
      label="Work"
      :required="true"
      :rule="ruleFor('workId')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <Dropdown
          id="tally-form-work"
          v-model="formModel.workId"
          :options="workOptions"
          option-label="title"
          option-value="id"
          placeholder="Select a project..."
          filter
          show-clear
          :loading="workStore.works === null"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="tally-form-count"
      label="Progress Made"
      :required="true"
      :rule="ruleFor('count')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="count-fieldset-container flex gap-2">
          <div class="count-fieldset-measure flex-none">
            <Dropdown
              id="tally-form-measure"
              v-model="formModel.measure"
              :options="measureOptions"
              option-label="label"
              option-value="id"
              @change="onMeasureChange"
            />
          </div>
          <div class="count-fieldset-count flex-auto">
            <TallyCountInput
              id="tally-form-count"
              v-model="formModel.count"
              :measure="formModel.measure"
              :invalid="!isFieldValid"
              @update:model-value="onUpdate"
            />
          </div>
        </div>
      </template>
    </FieldWrapper>
    <FieldWrapper
      label="Set new project total?"
      for="tally-form-total"
      :required="true"
      :rule="ruleFor('setTotal')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="flex gap-4 max-w-full items-center">
          <InputSwitch
            v-model="formModel.setTotal"
            :invalid="!isFieldValid"
            @update:model-value="onUpdate"
          />
          <div
            class="max-w-64 md:max-w-none"
          >
            {{ formatCount(formModel.count, formModel.measure) }} will be <span class="font-bold">{{ formModel.setTotal ? `set as` : `added to` }} the total</span> for this project {{ formModel.setTotal ? `as of` : `on` }} {{ formatDateSafe(formModel.date) }}.
          </div>
        </div>
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="tally-form-tags"
      label="Tags"
      :required="true"
      :rule="ruleFor('tags')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <MultiSelect
          id="tally-form-tags"
          v-model="formModel.tags"
          display="chip"
          :options="tagStore.tags"
          option-label="name"
          option-value="name"
          filter
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        >
          <template #emptyfilter>
            No matches: maybe you need to create a new tag?
          </template>
        </MultiSelect>
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="tally-form-notes"
      label="Note"
      :required="false"
      :rule="ruleFor('note')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <Textarea
          id="tally-form-note"
          v-model="formModel.note"
          auto-resize
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
      <template #message="{ validationMessage }">
        <div class="flex">
          <div class="validation-message flex-auto text-sm text-error-500">
            {{ validationMessage }}
          </div>
          <div :class="['flex-none text-sm text-right', { 'text-warning-500': formModel.note.length > MAXIMUM_NOTE_LENGTH - 20, 'text-danger-500': formModel.note.length > MAXIMUM_NOTE_LENGTH }]">
            {{ formModel.note.length }} / {{ MAXIMUM_NOTE_LENGTH }}
          </div>
        </div>
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
