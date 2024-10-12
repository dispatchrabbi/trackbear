<script setup lang="ts">
import { ref, reactive, computed, defineProps, withDefaults, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';

import { useWorkStore } from 'src/stores/work.ts';
const workStore = useWorkStore();
workStore.populate();

import { useTagStore } from 'src/stores/tag.ts';
const tagStore = useTagStore();
tagStore.populate();

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally.ts';
import type { NonEmptyArray } from 'server/lib/validators.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';
import type { ParticipantGoal } from 'server/lib/models/board';

import { joinBoard, BoardParticipantPayload, Board, ExtendedBoardParticipant } from 'src/lib/api/board.ts';

import MultiSelect from 'primevue/multiselect';
import Dropdown from 'primevue/dropdown';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
import TallyCountInput from '../tally/TallyCountInput.vue';
// import TbTag from 'src/components/tag/TbTag.vue';

const props = withDefaults(defineProps<{
  board: Board;
  participant?: ExtendedBoardParticipant;
}>(), {
  participant: null,
});
const emit = defineEmits(['participation:edit', 'formSuccess', 'formCancel']);

const isJoin = computed(() => {
  return props.participant === null;
});

const formModel = reactive({
  measure: isJoin.value ? TALLY_MEASURE.WORD : (props.participant.goal as ParticipantGoal)?.measure ?? TALLY_MEASURE.WORD,
  count: isJoin.value ? null : (props.participant.goal as ParticipantGoal)?.count ?? null,
  works: isJoin.value ? [] : props.participant.worksIncluded.map(work => work.id),
  tags: isJoin.value ? [] : props.participant.tagsIncluded.map(tag => tag.id),
});

const validations = z.object({
  measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>).nullable(),
  count: z
      .number({ invalid_type_error: 'Please enter a value.' }).int({ message: 'Please enter a whole number.' }).nullable()
      .refine(v => props.board.individualGoalMode ? v !== null : true, { message: 'Please input your goal for this leaderboard.'}),
  works: z.array(z.number({ invalid_type_error: 'Please select only valid projects.' }).int({ message: 'Please select only valid projects.' }).positive({ message: 'Please select only valid projects.' })),
  tags: z.array(z.number({ invalid_type_error: 'Please select only valid tags.' }).int({ message: 'Please select only valid tags.' }).positive({ message: 'Please select only valid tags.' })),
});

const { ruleFor, validate, isValid, formData } = useValidation(validations, formModel);

const measureOptions = computed(() => {
  return Object.values(TALLY_MEASURE).map(measure => ({
    id: measure,
    label: TALLY_MEASURE_INFO[measure].label.plural,
  }));
});

const onMeasureChange = function() {
  formModel.count = null;
}

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const data = formData();
    const payload: BoardParticipantPayload = {
      goal: props.board.individualGoalMode ? {
        measure: data.measure,
        count: data.count,
      } : null,
      works: data.works,
      tags: data.tags,
    };

    const updated = await joinBoard(props.board.uuid, payload);

    emit('participation:edit', { participation: updated });
    successMessage.value = `You have ${isJoin.value ? 'joined' : 'changed your selections for'} ${props.board.title}!`;

    await wait(1 * 1000);
    emit('formSuccess');
  } catch(err) {
    errorMessage.value = 'Could not submit: something went wrong server-side.'

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
    :loading-message="isLoading ? 'Submitting...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    cancel-button
    @submit="validate() && handleSubmit()"
    @cancel="emit('formCancel')"
  >
    <FieldWrapper
      v-if="props.board.individualGoalMode"
      for="board-form-goal-count"
      label="Your individual goal"
      :rule="ruleFor('count')"
      required
      help="This leaderboard requires every participant to set their own individual goal."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="count-fieldset-container flex gap-2">
          <div class="count-fieldset-measure flex-none">
            <Dropdown
              id="board-form-goal-measure"
              v-model="formModel.measure"
              :options="measureOptions"
              option-label="label"
              option-value="id"
              @change="onMeasureChange"
            />
          </div>
          <div class="count-fieldset-count flex-auto">
            <TallyCountInput
              id="board-form-goal-count"
              v-model="formModel.count"
              :measure="formModel.measure"
              :invalid="!isFieldValid"
              @update:model-value="onUpdate"
            />
          </div>
        </div>
      </template>
    </FieldWrapper>
    <div class="">
      Select which progress updates you want to include on this leaderboard. You can filter by project, tag, or both.
    </div>
    <FieldWrapper
      for="board-form-works"
      label="Projects to include"
      :rule="ruleFor('works')"
      info="Only progress entries from the selected projects will be included on this leaderboard."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <MultiSelect
          id="board-form-works"
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
      for="board-form-tags"
      label="Tags to include"
      :rule="ruleFor('tags')"
      info="Only progress entries with at least one of these tags will be included on this leaderboard."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <MultiSelect
          id="board-form-tags"
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
