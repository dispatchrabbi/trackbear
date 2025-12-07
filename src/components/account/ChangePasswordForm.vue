<script setup lang="ts">
import { ref, reactive } from 'vue';

import * as z from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { changePassword } from 'src/lib/api/auth.ts';

import Password from 'primevue/password';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const formModel = reactive({
  currentPassword: '',
  newPassword: '',
});

const validations = z.object({
  currentPassword: z.string().min(1, { error: 'Current password is required.' }),
  newPassword: z.string().min(8, { error: 'New password must be at least 8 characters long.' }),
});

const { formData, validate, isValid, ruleFor } = useValidation(validations, formModel);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    const { currentPassword, newPassword } = formData();
    await changePassword(currentPassword, newPassword);

    successMessage.value = 'Your password has been changed!';
    formModel.currentPassword = '';
    formModel.newPassword = '';
  } catch (err) {
    if(err.code === 'VALIDATION_FAILED') {
      errorMessage.value = err.message;
    } else if(err.code === 'INCORRECT_CREDS') {
      errorMessage.value = 'Current password did not match your actual password. Please check it and try again.';
    } else {
      errorMessage.value = 'Could not change your password; something went wrong server-side.';
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
    submit-label="Reset password"
    :loading-message="isLoading ? 'Resetting password...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <FieldWrapper
      for="reset-form-current-password"
      label="Current password"
      required
      :rule="ruleFor('currentPassword')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <Password
          id="reset-form-current-password"
          v-model="formModel.currentPassword"
          :invalid="!isFieldValid"
          :feedback="false"
          toggle-mask
          :pt="{ input: { root: { class: 'w-full pr-8', autocomplete: 'current-password' } } }"
          :pt-options="{ mergeSections: true, mergeProps: true }"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="reset-form-new-password"
      label="New password"
      required
      :rule="ruleFor('newPassword')"
      help="Password must be at least 8 characters long."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <Password
          id="reset-form-new-password"
          v-model="formModel.newPassword"
          :invalid="!isFieldValid"
          :feedback="false"
          toggle-mask
          :pt="{ input: { root: { class: 'w-full pr-8', autocomplete: 'new-password' } } }"
          :pt-options="{ mergeSections: true, mergeProps: true }"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
