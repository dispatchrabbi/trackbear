<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useEventBus } from '@vueuse/core';
import wait from 'src/lib/wait.ts';

import { useUserStore } from 'src/stores/user';
const userStore = useUserStore();

import { useProjectStore } from 'src/stores/project';
const projectStore = useProjectStore();
projectStore.populate();

import { useTagStore } from 'src/stores/tag.ts';
const tagStore = useTagStore();
tagStore.populate();

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';
import { TALLY_MEASURE, type TallyMeasure } from 'server/lib/models/tally/consts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';
import { userColorOrFallback, USER_COLOR_NAMES } from '../chart/user-colors';

import { updateMyParticipation, type Leaderboard, type Participation, type LeaderboardParticipationPayload, type LeaderboardTeam } from 'src/lib/api/leaderboard';

import InputSwitch from 'primevue/inputswitch';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Dropdown from 'primevue/dropdown';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
import TallyCountInput from '../tally/TallyCountInput.vue';
import TeamDropdown from './teams/TeamDropdown.vue';
import ColorDropdown from './ColorDropdown.vue';
// import TbTag from 'src/components/tag/TbTag.vue';

const props = withDefaults(defineProps<{
  leaderboard: Leaderboard;
  teams?: LeaderboardTeam[];
  participation: Participation;
}>(), {
  teams: () => ([] as LeaderboardTeam[]),
});

const emit = defineEmits(['leaderboard:edit-participation', 'formSuccess', 'formCancel']);
const eventBus = useEventBus<{ leaderboard: Leaderboard; participation: Participation }>('board:edit-participation');

type EditLeaderboardParticipationFormModel = {
  isParticipant: boolean;
  displayName: string;
  measure: TallyMeasure;
  count: number | null;
  works: number[];
  tags: number[];
  teamId: number | null;
  color: string;
};
const formModel = reactive<EditLeaderboardParticipationFormModel>({
  isParticipant: props.participation.isParticipant,
  displayName: props.participation.displayName || '',
  measure: props.participation.goal?.measure ?? TALLY_MEASURE.WORD,
  count: props.participation.goal?.count ?? 0,
  works: props.participation.workIds,
  tags: props.participation.tagIds,
  teamId: props.participation.teamId,
  color: userColorOrFallback(props.participation.color),
});

const validations = z.object({
  isParticipant: z.boolean({ error: 'Please pick whether you want to be a participant or a spectator.' }),
  displayName: z.union([
    z.string()
      .min(3, { error: 'Display name must be between 3 and 24 characters long.' })
      .max(24, { error: 'Display name must be between 3 and 24 characters long.' }),
    z.string().max(0),
  ]),
  measure: z.enum(Object.values(TALLY_MEASURE)).nullable(),
  count: z
    .number({ error: 'Please enter a value.' }).int({ error: 'Please enter a whole number.' }).nullable()
    .refine(v => props.leaderboard.individualGoalMode ? v !== null : true, { error: 'Please input your goal for this leaderboard.' }),
  works: z.array(z.number({ error: 'Please select only valid projects.' }).int({ error: 'Please select only valid projects.' }).positive({ error: 'Please select only valid projects.' })),
  tags: z.array(z.number({ error: 'Please select only valid tags.' }).int({ error: 'Please select only valid tags.' }).positive({ error: 'Please select only valid tags.' })),
  teamId: z.number({ error: 'Please select a valid team.' }).int({ error: 'Please select a valid team.' }).positive({ error: 'Please select a valid team.' }).nullable().default(null),
  color: z.enum(['', ...USER_COLOR_NAMES]),
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
    const payload: LeaderboardParticipationPayload = data.isParticipant ?
        // user is participating — send the info from the form
        {
          isParticipant: true,
          goal: props.leaderboard.individualGoalMode ? { measure: data.measure, count: data.count ?? 0 } : null,
          workIds: data.works,
          tagIds: data.tags,
          displayName: data.displayName,
          teamId: data.teamId,
          color: data.color,
        } :
        // user is not participating — save their previous participation info
        {
          isParticipant: false,
          goal: props.leaderboard.individualGoalMode ? props.participation.goal : null,
          workIds: props.participation.workIds,
          tagIds: props.participation.tagIds,
          displayName: data.displayName,
          teamId: data.teamId,
          color: data.color,
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
    submit-label="Save"
    :loading-message="isLoading ? 'Saving...' : null"
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
      for="leaderboard-form-display-name"
      label="Display Name"
      :rule="ruleFor('displayName')"
      help="If you leave this blank, your usual display name will be used. To set that, go to Account Settings."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="leaderboard-form-displayName"
          v-model="formModel.displayName"
          :placeholder="userStore.user!.displayName"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      v-if="formModel.isParticipant && props.leaderboard.enableTeams"
      for="leaderboard-form-team"
      label="Team"
      :rule="ruleFor('teamId')"
      help="This leaderboard has split its participants into teams. Pick a team to join."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <TeamDropdown
          v-model="formModel.teamId"
          id-prefix="leaderboard-form"
          :teams="props.teams"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      v-if="formModel.isParticipant && !props.leaderboard.enableTeams"
      for="leaderboard-form-color"
      label="Color"
      :rule="ruleFor('color')"
      help="This determines what color your progress will be on the graph."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <ColorDropdown
          v-model="formModel.color"
          id-prefix="leaderboard-form"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
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
    <div v-if="formModel.isParticipant">
      Select which progress updates you want to include on this leaderboard. You can filter by project, tag, or both.
    </div>
    <FieldWrapper
      v-if="formModel.isParticipant"
      for="leaderboard-form-projects"
      label="Projects to include"
      :rule="ruleFor('works')"
      info="Only progress entries from the selected projects will be included on this leaderboard."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <MultiSelect
          id="leaderboard-form-projects"
          v-model="formModel.works"
          display="chip"
          :options="projectStore.allProjects"
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
          :options="tagStore.allTags"
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
