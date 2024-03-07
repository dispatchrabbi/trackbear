<script setup lang="ts">
import { ref, reactive, computed, watch, defineEmits } from 'vue';

import { useWorkStore } from 'src/stores/work.ts';
const workStore = useWorkStore();
workStore.populateWorks();

import { useTagStore } from 'src/stores/tag.ts';
const tagStore = useTagStore();
tagStore.populateTags();

import { TALLY_MEASURE } from 'server/lib/entities/tally.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import { z } from 'zod';
import { NonEmptyArray } from 'server/lib/validators.ts';
import { formatDateSafe } from 'src/lib/date.ts';
import { useValidation } from 'src/lib/form.ts';

import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import DrowpdownPreset from 'src/themes/primevue-presets/wind/dropdown/index.js';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputNumber from 'primevue/inputnumber';
import MultiSelect from 'primevue/multiselect';
import Textarea from 'primevue/textarea';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const emit = defineEmits(['tallyCreated', 'requestClose']);

const formModel = reactive({
  date: new Date(), // default to today
  workId: null, // TODO: default to the current project, if we're in a project (using props)
  tags: [],
  count: null,
  measure: TALLY_MEASURE.WORD, // TODO: default to the last measure used
  setTotal: false,
  note: '',
});

const MAXIMUM_NOTE_LENGTH = 140;

const validations = z.object({
  date: z.date({ invalid_type_error:'Please select a date.' }).transform(formatDateSafe),
  workId: z.number({ invalid_type_error: 'Please select a project.' }).positive({ message: 'Please select a project.' }), // TODO: constrain to known projects
  tags: z.array(z.string()),
  count: z.number({ invalid_type_error: 'Please enter a value.' }).int({ message: 'Please enter a whole number.' }), // TODO: add measure type to error messages
  measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<typeof TALLY_MEASURE[keyof typeof TALLY_MEASURE]>, { required_error: 'Please pick a type.'}), // long way to go for `string`
  setTotal: z.boolean(),
  note: z.string().max(MAXIMUM_NOTE_LENGTH, { message: `Notes can be at most ${MAXIMUM_NOTE_LENGTH} characters.`}),
});

const { ruleFor, validate, isValid, formData } = useValidation(validations, formModel);

const measureOptions = computed(() => {
  return Object.values(TALLY_MEASURE).map(measure => ({
    id: measure,
    label: TALLY_MEASURE_INFO[measure].label.plural,
  }));
});

const timeCountModel = reactive({
  hours: null,
  minutes: null,
});

const timeValidations = z.object({
  hours: z.number({ invalid_type_error: 'Please enter a value for hours.' }).int({ message: 'Please enter a whole number.' }), // TODO: add measure type to error messages
  minutes: z.number({ invalid_type_error: 'Please enter a value for minutes.' }).int({ message: 'Please enter a whole number.' }), // TODO: add measure type to error messages
});

const { ruleFor: timeRuleFor, rulesFor: timeRulesFor, validate: timeValidate, isValid: timeIsValid } = useValidation(timeValidations, timeCountModel);

// always keep the real count up to date
watch(timeCountModel, val => formModel.count = ((formModel.measure === TALLY_MEASURE.TIME && timeIsValid.value) ? val.hours * 60 + val.minutes : null));

const onMeasureChange = function() {
  formModel.count = null;
  timeCountModel.hours = null;
  timeCountModel.minutes = null;
}

const wait = function(ms) {
  return new Promise(res => setTimeout(res, ms));
}

const isLoading = ref<boolean>(false);
const isSuccess = ref<boolean>(false);

const handleSubmitClick = async function() {
  if(!validate()) { return; }

  // submit the data
  isLoading.value = true;
  const data = formData();
  console.log(data);
  await wait(3000);

  // get the response
  const response = data;
  emit('tallyCreated', { tally: response });

  isLoading.value = false;
  isSuccess.value = true;

  // clear out the form
  formModel.workId = null; // TODO: default to the current project, if we're in a project (using props)
  formModel.tags = [];
  formModel.note = '';
  formModel.count = null;
  timeCountModel.hours = null;
  timeCountModel.minutes = null;

  // return to normal
  setTimeout(() => {
    isSuccess.value = false;
    emit('requestClose');
  }, 1000);
}

</script>

<template>
  <form
    class="tally-form gap-4"
    @submit.prevent="validate()"
  >
    <div class="date-area">
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
    </div>
    <div class="project-area">
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
            :options="workStore.works"
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
    </div>
    <div class="tags-area">
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
    </div>
    <div class="count-area">
      <FieldWrapper
        for="tally-form-count"
        label="Progress Made"
        :required="true"
        :rule="formModel.measure === TALLY_MEASURE.TIME ? timeRulesFor(['hours', 'minutes']) : ruleFor('count')"
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
              <InputGroup>
                <template v-if="formModel.measure === TALLY_MEASURE.TIME">
                  <InputNumber
                    id="tally-form-count"
                    v-model="timeCountModel.hours"
                    :pt="{ input: { root: { class: 'w-0 grow'} } }"
                    :pt-options="{ mergeSections: true, mergeProps: true }"
                    :invalid="timeRuleFor('hours')(timeCountModel.hours) !== true"
                    @update:model-value="() => onUpdate(timeCountModel)"
                  />
                  <InputGroupAddon class="min-w-0">
                    h
                  </InputGroupAddon>
                  <InputNumber
                    id="tally-form-count-minutes"
                    v-model="timeCountModel.minutes"
                    :pt="{ input: { root: { class: 'w-0 grow'} } }"
                    :pt-options="{ mergeSections: true, mergeProps: true }"
                    :invalid="timeRuleFor('minutes')(timeCountModel.minutes) !== true"
                    @update:model-value="() => onUpdate(timeCountModel)"
                  />
                  <InputGroupAddon class="min-w-0">
                    m
                  </InputGroupAddon>
                </template>
                <template v-else>
                  <InputNumber
                    id="tally-form-count"
                    v-model="formModel.count"
                    :pt="{ input: { root: { class: 'w-0 grow'} } }"
                    :pt-options="{ mergeSections: true, mergeProps: true }"
                    :invalid="!isFieldValid"
                    @update:model-value="onUpdate"
                  />
                  <InputGroupAddon>{{ TALLY_MEASURE_INFO[formModel.measure].counter.plural }}</InputGroupAddon>
                </template>
              </InputGroup>
            </div>
          </div>
        </template>
      </FieldWrapper>
    </div>
    <div class="notes-area">
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
            <div class="validation-message flex-auto text-sm text-red-500">
              {{ validationMessage }}
            </div>
            <div :class="['flex-none text-sm text-right', { 'text-orange-500': formModel.note.length > MAXIMUM_NOTE_LENGTH - 20, 'text-red-500': formModel.note.length > MAXIMUM_NOTE_LENGTH }]">
              {{ formModel.note.length }} / {{ MAXIMUM_NOTE_LENGTH }}
            </div>
          </div>
        </template>
      </FieldWrapper>
    </div>
    <div class="button-area justify-self-end">
      <Button
        :label="isLoading ? 'Submitting...' : isSuccess ? 'Logged!' : 'Submit'"
        size="large"
        :disabled="!isValid"
        :loading="isLoading"
        :icon="isSuccess ? 'pi pi-check' : null"
        @click="validate() && handleSubmitClick()"
      />
    </div>
  </form>
</template>

<style scoped>
.tally-form {
  display: grid;
  grid-template:
    "date"
    "project"
    "count"
    "tags"
    "notes"
    "button"
    / 1fr;
}

.title-area { grid-area: title; }
.date-area { grid-area: date; }
.project-area { grid-area: project; }
.tags-area { grid-area: tags; }
.count-area { grid-area: count; }
.mode-area { grid-area: mode; }
.total-area { grid-area: total; }
.notes-area { grid-area: notes; }
.button-area { grid-area: button; }

/* #tally-form-measure {
  @apply h-full;
  & > span {
    @apply self-center;
  }
} */

</style>
