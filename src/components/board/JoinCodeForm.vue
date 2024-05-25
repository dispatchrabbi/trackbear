<script setup lang="ts">
import { ref, reactive, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { getBoardParticipation } from 'src/lib/api/board.ts';

import InputText from 'primevue/inputtext';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const emit = defineEmits(['code:confirm', 'formSuccess']);

const formModel = reactive({
  joinCode: '',
});

const validations = z.object({
  joinCode: z.string().uuid({ message: 'Please make sure the join code is formatted correctly.' }),
});

const { ruleFor, validate, isValid } = useValidation(validations, formModel);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const board = await getBoardParticipation(formModel.joinCode);
    if(board.participants.length > 0) {
      errorMessage.value = `You have already joined this leaderboard.`;
    } else if(board.isJoinable && board.participants.length === 0) {
      emit('code:confirm', { code: formModel.joinCode });
      successMessage.value = `Join code confirmed!`;
    } else {
      errorMessage.value = `This leaderboard is not currently open to new members. Check with the leaderboard owner if you believe this should not be the case.`;
    }

    await wait(1 * 1000);
    emit('formSuccess');
  } catch(err) {
    if(err.code === 'NOT_FOUND') {
      errorMessage.value = 'This join code is invalid. Check it and try again.';
    } else {
      errorMessage.value = 'Could not look up the join code: something went wrong server-side.';
    }

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
    :loading-message="isLoading ? 'Checking...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <p>Please enter the leaderboard's Join Code below. If you don't have one, you can get it from the leaderboard's owner.</p>
    <FieldWrapper
      for="board-form-code"
      label="Join Code"
      required
      :rule="ruleFor('joinCode')"
    >
      <template #default>
        <InputText
          id="board-form-code"
          v-model="formModel.joinCode"
          autocomplete="off"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
