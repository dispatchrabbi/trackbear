<script setup lang="ts">
import { ref, reactive, defineProps, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { leaveBoard, Board } from 'src/lib/api/board.ts';

import InputText from 'primevue/inputtext';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const props = defineProps<{
  board: Board;
}>();
const emit = defineEmits(['board:leave', 'formSuccess']);

const formModel = reactive({
  leaveConfirmation: '',
});

const validations = z.object({
  leaveConfirmation: z.string().refine(val => val === userStore.user.username, { message: 'You must type your username exactly.',  }), // only allow exactly the work title
});

const { ruleFor, validate, isValid } = useValidation(validations, formModel);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  // let's just make extra sure
  if(!validate()) { return; }

  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const leftParticipant = await leaveBoard(props.board.uuid);

    emit('board:leave', { participant: leftParticipant, board: props.board });
    successMessage.value = `You have left ${props.board.title}.`;
    await wait(1 * 1000);
    emit('formSuccess');
  } catch(err) {
    errorMessage.value = 'Could not leave the leaderboard: something went wrong server-side.';

    return;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <TbForm
    :is-valid="isValid"
    submit-message="Leave"
    submit-severity="danger"
    :loading-message="isLoading ? 'Leaving...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <p class="font-bold text-red-500 dark:text-red-400">
      You are about to leave {{ props.board.title }}.
    </p>
    <p>In order to confirm that you want to leave this leaderboard, please type <span class="font-bold">{{ userStore.user.username }}</span> into the input below and click Leave.</p>
    <FieldWrapper
      for="board-form-confirmation"
      label="Type your username to confirm:"
      required
      :rule="ruleFor('leaveConfirmation')"
    >
      <template #default>
        <InputText
          id="board-form-confirmation"
          v-model="formModel.leaveConfirmation"
          autocomplete="off"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
