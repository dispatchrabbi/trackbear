<script setup lang="ts">
import { ref, reactive, defineEmits } from 'vue';
import { useEventBus } from '@vueuse/core';
import wait from 'src/lib/wait.ts';
import { toTitleCase } from 'src/lib/str.ts';

import { z } from 'zod';
import { NonEmptyArray } from 'server/lib/validators.ts';
import { formatDateSafe } from 'src/lib/date.ts';
import { useValidation } from 'src/lib/form.ts';

import { createLeaderboard, type LeaderboardCreatePayload, type Leaderboard } from 'src/lib/api/leaderboard';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import Calendar from 'primevue/calendar';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import InputSwitch from 'primevue/inputswitch';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
import MultiMeasureInput from 'src/components/project/MultiMeasureInput.vue';

const emit = defineEmits(['leaderboard:create', 'formSuccess', 'formCancel']);
const eventBus = useEventBus<{ leaderboard: Leaderboard }>('leaderboard:create');

const formModel = reactive({
  title: '',
  description: '',

  startDate: null,
  endDate: null,

  measures: Object.values(TALLY_MEASURE),
  goal: {},
  individualGoalMode: false,
  fundraiserMode: false,

  isJoinable: true,
  isPublic: false,
});

const validations = z
  .object({
    title: z.string().min(1, { message: 'Please enter a title.' }),
    description: z.string(),

    startDate: z
      .date({ invalid_type_error: 'Please select a valid start date or clear the field.' }).nullable()
      .refine(v => v === null || formModel.endDate === null || v <= formModel.endDate, { message: 'Start date must be before end date.' }).transform(formatDateSafe),
    endDate: z
      .date({ invalid_type_error: 'Please select a valid end date or clear the field.' }).nullable()
      .refine(v => v === null || formModel.startDate === null || v >= formModel.startDate, { message: 'End date must be after start date.' }).transform(formatDateSafe),

    measures: z.array(z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>))
      .refine(arr => {
        if(formModel.individualGoalMode) {
          return true;
        } else {
          return arr.length >= 1;
        }
      }, { message: 'Please select at least one.' }),
    goal: z.record(
      z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
      z.number({ invalid_type_error: 'Please fill in all balances, or remove blank rows.' }).int({ message: 'Please only enter whole numbers.' }),
    ),
    individualGoalMode: z.boolean(),
    fundraiserMode: z.boolean(),

    isJoinable: z.boolean(),
  });

const { ruleFor, validate, isValid, formData } = useValidation(validations, formModel);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const data = formData();
    if(data.individualGoalMode) {
      data.measures = [];
      data.goal = {};
      data.fundraiserMode = false;
    }
    data.isPublic = false;

    const createdBoard = await createLeaderboard(data as LeaderboardCreatePayload);

    emit('leaderboard:create', { board: createdBoard });
    eventBus.emit({ leaderboard: createdBoard });

    successMessage.value = `${createdBoard.title} has been created.`;
    await wait(1 * 1000);

    emit('formSuccess');
  } catch {
    errorMessage.value = 'Could not create the leaderboard: something went wrong server-side.';

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
      for="leaderboard-form-title"
      label="Title"
      required
      :rule="ruleFor('title')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="leaderboard-form-title"
          v-model="formModel.title"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="leaderboard-form-description"
      label="Description"
      :rule="ruleFor('description')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="leaderboard-form-description"
          v-model="formModel.description"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="leaderboard-form-start-date"
      label="Start Date"
      :rule="ruleFor('startDate')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <!-- yy-mm-dd looks incorrect but here, yy is for four digits -->
        <Calendar
          id="leaderboard-form-start-date"
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
      for="leaderboard-form-end-date"
      label="End Date"
      :rule="ruleFor('endDate')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <!-- yy-mm-dd looks incorrect but here, yy is for four digits -->
        <Calendar
          id="leaderboard-form-end-date"
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
      label="Same goal or individual goals?"
      for="leaderboard-form-individual-goal-mode"
      :required="true"
      :rule="ruleFor('individualGoalMode')"
      :help="formModel.individualGoalMode ? 'Participants must set a goal for themselves before they will show up on the leaderboard.' : ''"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="flex gap-4 max-w-full items-center">
          <InputSwitch
            v-model="formModel.individualGoalMode"
            :invalid="!isFieldValid"
            @update:model-value="onUpdate"
          />
          <div
            class="max-w-64 md:max-w-none"
          >
            Everyone will be working toward <span class="font-bold">{{ formModel.individualGoalMode ? `their own goals` : `the same goal` }}</span>.
          </div>
        </div>
      </template>
    </FieldWrapper>
    <FieldWrapper
      v-if="!formModel.individualGoalMode"
      for="leaderboard-form-measures"
      label="What to track?"
      :rule="ruleFor('measures')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div
          v-for="measure of Object.values(TALLY_MEASURE)"
          :key="measure"
          class="flex items-center gap-2"
        >
          <Checkbox
            v-model="formModel.measures"
            :input-id="`leaderboard-form-measures-checkbox-${measure}`"
            name="leaderboard-form-measures"
            :value="measure"
            :invalid="!isFieldValid"
            @update:model-value="onUpdate"
          />
          <label :for="`leaderboard-form-measures-checkbox-${measure}`">{{ toTitleCase(TALLY_MEASURE_INFO[measure].label.plural) }}</label>
        </div>
      </template>
    </FieldWrapper>
    <FieldWrapper
      v-if="!formModel.individualGoalMode"
      for="leaderboard-form-goal"
      label="Leaderboard goal"
      :rule="ruleFor('goal')"
      help="If you want, you can set a goal for each type of progress you're tracking on this leaderboard."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <MultiMeasureInput
          id="leaderboard-form-goal"
          v-model="formModel.goal"
          :invalid="!isFieldValid"
          add-button-text="Add Goal"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      v-if="!formModel.individualGoalMode"
      label="Fundraiser Mode"
      for="leaderboard-form-fundraiser-mode"
      :required="true"
      :rule="ruleFor('fundraiserMode')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="flex gap-4 max-w-full items-center">
          <InputSwitch
            v-model="formModel.fundraiserMode"
            :invalid="!isFieldValid"
            @update:model-value="onUpdate"
          />
          <div
            class="max-w-64 md:max-w-none"
          >
            Everyone's progress will be counted <span class="font-bold">{{ formModel.fundraiserMode ? `collectively` : `separately` }}</span>.
          </div>
        </div>
      </template>
    </FieldWrapper>
    <FieldWrapper
      label="Can people join?"
      for="leaderboard-form-fundraiser-mode"
      :required="true"
      :rule="ruleFor('isJoinable')"
      help="You can always change this setting later."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="flex gap-4 max-w-full items-center">
          <InputSwitch
            v-model="formModel.isJoinable"
            :invalid="!isFieldValid"
            @update:model-value="onUpdate"
          />
          <div
            class="max-w-64 md:max-w-none"
          >
            This leaderboard is <span class="font-bold">{{ formModel.isJoinable ? `open` : `closed` }}</span> for users to join.
          </div>
        </div>
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
