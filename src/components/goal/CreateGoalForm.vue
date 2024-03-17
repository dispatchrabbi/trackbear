<script setup lang="ts">
import { ref, reactive, computed, watch, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';
import { toTitleCase } from 'src/lib/str.ts';

import { useWorkStore } from 'src/stores/work.ts';
const workStore = useWorkStore();
workStore.populateWorks();

import { useTagStore } from 'src/stores/tag.ts';
const tagStore = useTagStore();
tagStore.populateTags();

import { z } from 'zod';
import { NonEmptyArray } from 'server/lib/validators.ts';
import { formatDateSafe } from 'src/lib/date.ts';
import { useValidation } from 'src/lib/form.ts';

import { createGoal, GoalPayload } from 'src/lib/api/goal.ts';
import { GOAL_TYPE, GOAL_CADENCE_UNIT, GoalParameters } from 'server/lib/models/goal.ts';
import { GOAL_CADENCE_UNIT_INFO } from 'src/lib/goal.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
import TbTag from 'src/components/tag/TbTag.vue';

const emit = defineEmits(['goal:create', 'formSuccess', 'formCancel']);

const formModel = reactive({
  title: '',
  description: '',

  type: GOAL_TYPE.TARGET,
  measure: TALLY_MEASURE.WORD,
  count: null,
  unit: GOAL_CADENCE_UNIT.DAY,
  period: null,

  startDate: null,
  endDate: null,

  works: [],
  tags: [],
});

const validations = z
  .object({
    title: z.string().min(1, { message: 'Please enter a title.'}),
    description: z.string(),

    type: z.enum(Object.values(GOAL_TYPE) as NonEmptyArray<typeof GOAL_TYPE[keyof typeof GOAL_TYPE]>, { required_error: 'Please pick a goal type.'}),
    measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
    count: z
      .number({ invalid_type_error: 'Please enter a value.' }).int({ message: 'Please enter a whole number.' }).nullable()
      .refine(v => formModel.type === GOAL_TYPE.TARGET ? v !== null : true, { message: 'A progress threshold is required for targets.'}),
    unit: z.enum(Object.values(GOAL_CADENCE_UNIT) as NonEmptyArray<string>),
    period: z
      .number({ invalid_type_error: 'Please enter a value.' }).int({ message: 'Please enter a whole number.' }).positive({ message: 'Please enter a positive number.' }).nullable()
      .refine(v => formModel.type === GOAL_TYPE.HABIT ? v !== null : true, { message: 'A time period is required for habits.'}),

    startDate: z
      .date({ invalid_type_error:'Please select a valid start date or clear the field.' }).nullable()
      .refine(v => v === null || formModel.endDate === null || v <= formModel.endDate, { message: 'Start date must be before end date.'}).transform(formatDateSafe),
    endDate: z
    .date({ invalid_type_error:'Please select a valid end date or clear the field.' }).nullable()
    .refine(v => v === null || formModel.startDate === null || v >= formModel.startDate, { message: 'End date must be after start date.'}).transform(formatDateSafe),

    works: z.array(z.number({ invalid_type_error: 'Please select only valid projects.' }).int({ message: 'Please select only valid projects.' }).positive({ message: 'Please select only valid projects.' })),
    tags: z.array(z.number({ invalid_type_error: 'Please select only valid tags.' }).int({ message: 'Please select only valid tags.' }).positive({ message: 'Please select only valid tags.' })),
  });

const { ruleFor, validate, isValid, formData } = useValidation(validations, formModel);

const typeOptions = computed(() => {
  return Object.keys(GOAL_TYPE).map(key => ({
    label: toTitleCase(GOAL_TYPE[key]),
    value: GOAL_TYPE[key],
  }));
});

const typeHelpText = {
  [GOAL_TYPE.TARGET]: `A target tracks your progress toward an end goal (e.g., writing 50,000 words by the end of the month).`,
  [GOAL_TYPE.HABIT]: `A habit tracks whether you've made progress on a regular basis (e.g., writing a least a little bit every day).`,
};

const measureOptions = computed(() => {
  return Object.values(TALLY_MEASURE).map(measure => ({
    id: measure,
    label: TALLY_MEASURE_INFO[measure].label.plural,
  }));
});

const unitOptions = computed(() => {
  return Object.values(GOAL_CADENCE_UNIT).map(unit => ({
    id: unit,
    label: GOAL_CADENCE_UNIT_INFO[unit].label[formModel.period === 1 ? 'singular' : 'plural'],
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

const { ruleFor: timeRuleFor, rulesFor: timeRulesFor, isValid: timeIsValid } = useValidation(timeValidations, timeCountModel);

// always keep the real count up to date
watch(timeCountModel, val => formModel.count = ((formModel.measure === TALLY_MEASURE.TIME && timeIsValid.value) ? val.hours * 60 + val.minutes : null));

const onMeasureChange = function() {
  formModel.count = null;
  timeCountModel.hours = null;
  timeCountModel.minutes = null;
};

const savedParams = reactive({
  period: null,
  unit: GOAL_CADENCE_UNIT.DAY,

  count: null,
  hours: null,
  minutes: null,
  measure: TALLY_MEASURE.WORD,
});
const onTypeChange = function() {
  // record the current params
  const currentParams = {
    period: formModel.period,
    unit: formModel.unit,

    count: formModel.count,
    hours: timeCountModel.hours,
    minutes: timeCountModel.minutes,
    measure: formModel.measure,
  };

  // restore the saved params
  formModel.period = savedParams.period;
  formModel.unit = savedParams.unit;

  formModel.count = savedParams.count;
  timeCountModel.hours = savedParams.hours;
  timeCountModel.minutes = savedParams.minutes;
  formModel.measure = savedParams.measure;

  // overwrite the saved params with the current params
  savedParams.period = currentParams.period;
  savedParams.unit = currentParams.unit;

  savedParams.count = currentParams.count;
  savedParams.hours = currentParams.hours;
  savedParams.minutes = currentParams.minutes;
  savedParams.measure = currentParams.measure;
};

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const rawData = formData() as z.infer<typeof validations>;

    let parameters = {};
    if(rawData.type === GOAL_TYPE.TARGET) {
      parameters = {
        threshold: {
          count: rawData.count,
          measure: rawData.measure,
        },
      };
    } else if(rawData.type === GOAL_TYPE.HABIT) {
      parameters = {
        cadence: {
          unit: rawData.unit,
          period: rawData.period,
        },
        threshold: rawData.count === null ? null : {
          count: rawData.count,
          measure: rawData.measure,
        },
      };
    }

    const data: GoalPayload = {
      title: rawData.title,
      description: rawData.description,

      type: rawData.type,
      parameters: parameters as GoalParameters,

      startDate: rawData.startDate,
      endDate: rawData.endDate,

      works: rawData.works,
      tags: rawData.tags,
    };

    const createdGoal = await createGoal(data);

    emit('goal:create', { goal: createdGoal.goal });
    successMessage.value = `${createdGoal.goal.title} has been created.`;
    await wait(1 * 1000);
    emit('formSuccess');
  } catch(err) {
    errorMessage.value = 'Could not create the goal: something went wrong server-side.';

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
    cancel-button
    @submit="validate() && handleSubmit()"
    @cancel="emit('formCancel')"
  >
    <FieldWrapper
      for="goal-form-title"
      label="Title"
      required
      :rule="ruleFor('title')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="goal-form-title"
          v-model="formModel.title"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="goal-form-description"
      label="Description"
      :rule="ruleFor('description')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="goal-form-description"
          v-model="formModel.description"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="goal-form-type"
      label="Goal Type"
      :help="typeHelpText[formModel.type]"
      required
      :rule="ruleFor('type')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <Dropdown
          id="goal-form-type"
          v-model="formModel.type"
          :options="typeOptions"
          option-label="label"
          option-value="value"
          :invalid="!isFieldValid"
          @update:model-value="val => { onUpdate(val); onTypeChange(); }"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      v-if="formModel.type === GOAL_TYPE.HABIT"
      for="goal-form-period"
      label="How Often?"
      :required="formModel.type === GOAL_TYPE.HABIT"
      :rule="ruleFor('period')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="period-fieldset-container flex gap-2">
          <div class="period-fieldset-period flex-auto">
            <InputGroup>
              <InputGroupAddon>Every</InputGroupAddon>
              <InputNumber
                id="goal-form-period"
                v-model="formModel.period"
                :pt="{ input: { root: { class: 'w-0 grow'} } }"
                :pt-options="{ mergeSections: true, mergeProps: true }"
                :invalid="!isFieldValid"
                @update:model-value="onUpdate"
              />
            </InputGroup>
          </div>
          <div class="period-fieldset-unit flex-none">
            <Dropdown
              id="goal-form-unit"
              v-model="formModel.unit"
              :options="unitOptions"
              option-label="label"
              option-value="id"
            />
          </div>
        </div>
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="goal-form-count"
      label="How Much?"
      :required="formModel.type === GOAL_TYPE.TARGET"
      :rule="formModel.measure === TALLY_MEASURE.TIME ? timeRulesFor(['hours', 'minutes']) : ruleFor('count')"
      :help="formModel.type === GOAL_TYPE.HABIT ? `Leave this field blank for all progress logged to count for this habit.` : null"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="count-fieldset-container flex gap-2">
          <div class="count-fieldset-measure flex-none">
            <Dropdown
              id="goal-form-measure"
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
                  id="goal-form-count"
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
                  id="goal-form-count-minutes"
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
                  id="goal-form-count"
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
    <FieldWrapper
      for="goal-form-start-date"
      label="Start Date"
      :rule="ruleFor('startDate')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <!-- yy-mm-dd looks incorrect but here, yy is for four digits -->
        <Calendar
          id="goal-form-start-date"
          v-model="formModel.startDate"
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
      for="goal-form-end-date"
      label="End Date"
      :rule="ruleFor('endDate')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <!-- yy-mm-dd looks incorrect but here, yy is for four digits -->
        <Calendar
          id="goal-form-end-date"
          v-model="formModel.endDate"
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
      for="goal-form-works"
      label="Projects to include"
      :rule="ruleFor('works')"
      info="Only progress entries from the selected projects will count toward your goal."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <MultiSelect
          id="goal-form-works"
          v-model="formModel.works"
          display="chip"
          :options="workStore.works"
          option-label="title"
          option-value="id"
          filter
          :invalid="!isFieldValid"
          placeholder="(all projects)"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="goal-form-tags"
      label="Tags to include"
      :rule="ruleFor('tags')"
      info="Only progress entries with one of these tags will count toward your goal."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <MultiSelect
          id="goal-form-tags"
          v-model="formModel.tags"
          display="chip"
          :options="tagStore.tags"
          option-label="name"
          option-value="id"
          filter
          :invalid="!isFieldValid"
          placeholder="(don't filter by tag)"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
