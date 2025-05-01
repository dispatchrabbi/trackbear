<script setup lang="ts">
import { ref, reactive, defineProps, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { updateUserState } from 'src/lib/api/admin/user.ts';
import { USER_STATE } from 'server/lib/models/user/consts';

import InputText from 'primevue/inputtext';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const props = defineProps<{
  user: { id: number; username: string };
}>();

const emit = defineEmits(['user:restore', 'formSuccess']);

const formModel = reactive({
  restoreConfirmation: '',
});

const validations = z.object({
  restoreConfirmation: z.string().refine(val => val === props.user.username, { message: 'You must type the username exactly.' }),
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
    await updateUserState(props.user.id, { state: USER_STATE.ACTIVE });
    emit('user:restore');

    successMessage.value = `The account has been restored.`;
    await wait(1 * 1000);
    emit('formSuccess');
  } catch {
    errorMessage.value = 'Could not restore the account: something went wrong server-side.';

    return;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <TbForm
    :is-valid="isValid"
    submit-message="Restore"
    submit-severity="success"
    :loading-message="isLoading ? 'Restoring...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <p class="font-bold text-success-500 dark:text-success-400">
      You are about to restore this account. Make sure you mean to do this!
    </p>
    <p>In order to confirm that you want to restore this account, please type <span class="font-bold">{{ props.user.username }}</span> into the input below and click Restore.</p>
    <FieldWrapper
      for="goal-form-confirmation"
      label="Type the username to confirm restoration:"
      required
      :rule="ruleFor('restoreConfirmation')"
    >
      <template #default>
        <InputText
          id="goal-form-confirmation"
          v-model="formModel.restoreConfirmation"
          autocomplete="off"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
