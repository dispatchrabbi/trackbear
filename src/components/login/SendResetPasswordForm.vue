<script setup lang="ts">
import { ref, reactive } from 'vue';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { requestPasswordReset } from 'src/lib/api/auth.ts';

import InputText from 'primevue/inputtext';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const formModel = reactive({
  username: '',
});

const validations = z.object({
  username: z.string().min(1, { message: 'Please enter your username.' }),
});

const { formData, validate, isValid, ruleFor } = useValidation(validations, formModel);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const { username } = formData();
    await requestPasswordReset(username);
    successMessage.value = 'An email has been sent to your email address with a password reset link.';
  } catch (err) {
    errorMessage.value = err;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <TbForm
    :is-valid="isValid"
    submit-message="Reset password"
    :loading-message="isLoading ? 'Requesting reset...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <FieldWrapper
      for="reset-form-username"
      label="Username"
      required
      :rule="ruleFor('username')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="reset-form-username"
          v-model="formModel.username"
          autocomplete="username"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
