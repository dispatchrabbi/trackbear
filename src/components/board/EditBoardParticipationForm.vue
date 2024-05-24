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

import { joinBoard, BoardParticipantPayload, Board, ExtendedBoardParticipant } from 'src/lib/api/board.ts';

import MultiSelect from 'primevue/multiselect';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
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
  works: isJoin.value ? [] : props.participant.worksIncluded.map(work => work.id),
  tags: isJoin.value ? [] : props.participant.tagsIncluded.map(tag => tag.id),
});

const validations = z.object({
  works: z.array(z.number({ invalid_type_error: 'Please select only valid projects.' }).int({ message: 'Please select only valid projects.' }).positive({ message: 'Please select only valid projects.' })),
  tags: z.array(z.number({ invalid_type_error: 'Please select only valid tags.' }).int({ message: 'Please select only valid tags.' }).positive({ message: 'Please select only valid tags.' })),
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
    const updated = await joinBoard(props.board.uuid, data as BoardParticipantPayload);

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
      for="board-form-works"
      label="Projects to include"
      :rule="ruleFor('works')"
      info="Only progress entries from the selected projects will be included on this board."
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
      info="Only progress entries with at least one of these tags will be included on this board."
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
