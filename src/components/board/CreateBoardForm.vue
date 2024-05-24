<script setup lang="ts">
import { ref, reactive, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';

import { useBoardStore } from 'src/stores/board.ts';
const boardStore = useBoardStore();
boardStore.populate();

import { useTagStore } from 'src/stores/tag.ts';
const tagStore = useTagStore();
tagStore.populate();

import { z } from 'zod';
import { NonEmptyArray } from 'server/lib/validators.ts';
import { formatDateSafe } from 'src/lib/date.ts';
import { useValidation } from 'src/lib/form.ts';

import { createBoard, BoardCreatePayload } from 'src/lib/api/board.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import Calendar from 'primevue/calendar';
import InputText from 'primevue/inputtext';
import InputSwitch from 'primevue/inputswitch';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
import MultiMeasureInput from 'src/components/work/MultiMeasureInput.vue';
// import TbTag from 'src/components/tag/TbTag.vue';

const emit = defineEmits(['board:create', 'formSuccess', 'formCancel']);

const formModel = reactive({
  title: '',
  description: '',

  startDate: null,
  endDate: null,

  goal: {},

  isJoinable: true,
  isPublic: false,
});

const validations = z
  .object({
    title: z.string().min(1, { message: 'Please enter a title.'}),
    description: z.string(),

    startDate: z
      .date({ invalid_type_error:'Please select a valid start date or clear the field.' }).nullable()
      .refine(v => v === null || formModel.endDate === null || v <= formModel.endDate, { message: 'Start date must be before end date.'}).transform(formatDateSafe),
    endDate: z
      .date({ invalid_type_error:'Please select a valid end date or clear the field.' }).nullable()
      .refine(v => v === null || formModel.startDate === null || v >= formModel.startDate, { message: 'End date must be after start date.'}).transform(formatDateSafe),

    goal: z.record(
      z.enum(Object.keys(TALLY_MEASURE_INFO) as NonEmptyArray<string>),
      z.number({ invalid_type_error: 'Please fill in all balances, or remove blank rows.' }).int({ message: 'Please only enter whole numbers.' })
    ),

    isJoinable: z.boolean(),
    isPublic: z.boolean(),
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
    const createdBoard = await createBoard(data as BoardCreatePayload);

    emit('board:create', { board: createdBoard });
    successMessage.value = `${createdBoard.title} has been created.`;
    await wait(1 * 1000);
    emit('formSuccess');
  } catch(err) {
    errorMessage.value = 'Could not create the board: something went wrong server-side.';

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
      for="board-form-title"
      label="Title"
      required
      :rule="ruleFor('title')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="board-form-title"
          v-model="formModel.title"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="board-form-description"
      label="Description"
      :rule="ruleFor('description')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="board-form-description"
          v-model="formModel.description"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="board-form-start-date"
      label="Start Date"
      :rule="ruleFor('startDate')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <!-- yy-mm-dd looks incorrect but here, yy is for four digits -->
        <Calendar
          id="board-form-start-date"
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
      for="board-form-end-date"
      label="End Date"
      :rule="ruleFor('endDate')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <!-- yy-mm-dd looks incorrect but here, yy is for four digits -->
        <Calendar
          id="board-form-end-date"
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
      for="board-form-goal"
      label="Goal"
      :rule="ruleFor('goal')"
      help="If your board's participants will be tracking progress in different ways, you can set a goal for each type of progress."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <MultiMeasureInput
          id="work-form-goal"
          v-model="formModel.goal"
          :invalid="!isFieldValid"
          add-button-text="Add Goal"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      label="Can people join?"
      for="board-form-is-joinable"
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
            This board is <span class="font-bold">{{ formModel.isJoinable ? `open` : `closed` }}</span> for users to join.
          </div>
        </div>
      </template>
    </FieldWrapper>
    <FieldWrapper
      label="Can everyone see this board?"
      for="board-form-is-public"
      :required="true"
      :rule="ruleFor('isPublic')"
      help="You can always change this setting later."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="flex gap-4 max-w-full items-center">
          <InputSwitch
            v-model="formModel.isPublic"
            :invalid="!isFieldValid"
            @update:model-value="onUpdate"
          />
          <div
            class="max-w-64 md:max-w-none"
          >
            <span class="font-bold">{{ formModel.isPublic ? `Any user with the link` : `Only participants` }}</span> will be able to view this board. {{ formModel.isPublic ? `They will not need to join it to do so.` : `Non-participants will not be able to view it until they join.` }}
          </div>
        </div>
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
