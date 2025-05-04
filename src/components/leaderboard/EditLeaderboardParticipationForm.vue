<script setup lang="ts">
import { ref, reactive, computed, defineProps, defineEmits } from 'vue';
import { useEventBus } from '@vueuse/core';
import wait from 'src/lib/wait.ts';

import { useWorkStore } from 'src/stores/work.ts';
const workStore = useWorkStore();
workStore.populate();

import { useTagStore } from 'src/stores/tag.ts';
const tagStore = useTagStore();
tagStore.populate();

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts';
import type { NonEmptyArray } from 'server/lib/validators.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import { updateMyParticipation, type Leaderboard, type Participation, type LeaderboardParticipationUpdatePayload } from 'src/lib/api/leaderboard';

import InputSwitch from 'primevue/inputswitch';
import MultiSelect from 'primevue/multiselect';
import Dropdown from 'primevue/dropdown';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
import TallyCountInput from '../tally/TallyCountInput.vue';
// import TbTag from 'src/components/tag/TbTag.vue';

const props = defineProps<{
  leaderboard: Leaderboard;
  participation: Participation;
}>();

const emit = defineEmits(['leaderboard:edit-participation', 'formSuccess', 'formCancel']);
const eventBus = useEventBus<{ leaderboard: Leaderboard; participation: Participation }>('board:edit-participation');

const formModel = reactive({
  isParticipant: props.participation.isParticipant,
  measure: props.participation.goal?.measure ?? TALLY_MEASURE.WORD,
  count: props.participation.goal?.count ?? 0,
  works: props.participation.workIds,
  tags: props.participation.tagIds,
});

const validations = z.object({
  isParticipant: z.boolean({ invalid_type_error: 'Please pick whether you want to be a participant or a spectator.' }),
  measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>).nullable(),
  count: z
    .number({ invalid_type_error: 'Please enter a value.' }).int({ message: 'Please enter a whole number.' }).nullable()
    .refine(v => props.leaderboard.individualGoalMode ? v !== null : true, { message: 'Please input your goal for this leaderboard.' }),
  works: z.array(z.number({ invalid_type_error: 'Please select only valid projects.' }).int({ message: 'Please select only valid projects.' }).positive({ message: 'Please select only valid projects.' })),
  tags: z.array(z.number({ invalid_type_error: 'Please select only valid tags.' }).int({ message: 'Please select only valid tags.' }).positive({ message: 'Please select only valid tags.' })),
});

const { ruleFor, validate, isValid, formData } = useValidation(validations, formModel);

const isWholeFormValid = computed(() => {
  if(formModel.isParticipant) {
    return isValid.value;
  } else {
    // we don't care about the rest of the form if the user isn't participating
    return true;
  }
});

const validateUsingIsParticipant = function() {
  if(formModel.isParticipant) {
    return validate();
  } else {
    // we don't care about the rest of the form if the user isn't participating
    return true;
  }
};

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
    const payload: LeaderboardParticipationUpdatePayload = data.isParticipant ?
        // user is participating — send the info from the form
        {
          isParticipant: true,
          goal: props.leaderboard.individualGoalMode ? { measure: data.measure, count: data.count } : null,
          workIds: data.works,
          tagIds: data.tags,
        } :
        // user is not participating — save their previous participation info
        {
          isParticipant: false,
          goal: props.leaderboard.individualGoalMode ? props.participation.goal : null,
          workIds: props.participation.workIds,
          tagIds: props.participation.tagIds,
        };

    const updated = await updateMyParticipation(props.leaderboard.uuid, payload);

    emit('leaderboard:edit-participation', { participation: updated });
    eventBus.emit({ leaderboard: props.leaderboard, participation: updated });

    successMessage.value = `You have changed your selections for ${props.leaderboard.title}!`;
    await wait(1 * 1000);

    emit('formSuccess');
  } catch {
    errorMessage.value = 'Could not submit: something went wrong server-side.';

    return;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <TbForm
    :is-valid="isWholeFormValid"
    submit-message="Submit"
    :loading-message="isLoading ? 'Submitting...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    cancel-button
    @submit="validateUsingIsParticipant() && handleSubmit()"
    @cancel="emit('formCancel')"
  >
    <FieldWrapper
      for="leaderboard-form-is-participant"
      label="Are you participating in this leaderboard?"
      :rule="ruleFor('isParticipant')"
      required
      help="Spectators do not appear in leaderboard charts or standings."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="flex gap-4 max-w-full items-center">
          <InputSwitch
            v-model="formModel.isParticipant"
            :invalid="!isFieldValid"
            @update:model-value="onUpdate"
          />
          <div
            class="max-w-64 md:max-w-none"
          >
            I am <b>{{ formModel.isParticipant ? 'participating in' : `just spectating` }}</b> this leaderboard.
          </div>
        </div>
      </template>
    </FieldWrapper>
    <FieldWrapper
      v-if="formModel.isParticipant && props.leaderboard.individualGoalMode"
      for="leaderboard-form-goal-count"
      label="Your individual goal"
      :rule="ruleFor('count')"
      required
      help="This leaderboard requires every participant to set their own individual goal."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="count-fieldset-container flex gap-2">
          <div class="count-fieldset-measure flex-none">
            <Dropdown
              id="leaderboard-form-goal-measure"
              v-model="formModel.measure"
              :options="measureOptions"
              option-label="label"
              option-value="id"
              :disabled="!formModel.isParticipant"
              @change="onMeasureChange"
            />
          </div>
          <div class="count-fieldset-count flex-auto">
            <TallyCountInput
              id="leaderboard-form-goal-count"
              v-model="formModel.count"
              :measure="formModel.measure"
              :invalid="!isFieldValid"
              :disabled="!formModel.isParticipant"
              @update:model-value="onUpdate"
            />
          </div>
        </div>
      </template>
    </FieldWrapper>
    <div
      v-if="formModel.isParticipant"
    >
      Select which progress updates you want to include on this leaderboard. You can filter by project, tag, or both.
    </div>
    <FieldWrapper
      v-if="formModel.isParticipant"
      for="leaderboard-form-works"
      label="Projects to include"
      :rule="ruleFor('works')"
      info="Only progress entries from the selected projects will be included on this leaderboard."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <MultiSelect
          id="leaderboard-form-works"
          v-model="formModel.works"
          display="chip"
          :options="workStore.works"
          option-label="title"
          option-value="id"
          filter
          :invalid="!isFieldValid"
          placeholder="(all projects)"
          :disabled="!formModel.isParticipant"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      v-if="formModel.isParticipant"
      for="leaderboard-form-tags"
      label="Tags to include"
      :rule="ruleFor('tags')"
      info="Only progress entries with at least one of these tags will be included on this leaderboard."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <MultiSelect
          id="leaderboard-form-tags"
          v-model="formModel.tags"
          display="chip"
          :options="tagStore.tags"
          option-label="name"
          option-value="id"
          filter
          :invalid="!isFieldValid"
          placeholder="(don't filter by tag)"
          :disabled="!formModel.isParticipant"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped></style>
