<script setup lang="ts">
import { ref, reactive } from 'vue';
import wait from 'src/lib/wait.ts';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();

import { resetPassword } from 'src/lib/api/auth.ts';

import Password from 'primevue/password';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const formModel = reactive({
  newPassword: '',
});

const validations = z.object({
  newPassword: z.string().min(8, { error: 'Password must be at least 8 characters long.' }),
});

const { formData, validate, isValid, ruleFor } = useValidation(validations, formModel);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

function checkUuidParam() {
  if(!z.uuid().safeParse(route.params.resetUuid).success) {
    router.push('/');
    return;
  }
}

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const { newPassword } = formData();

    const uuidParam = typeof route.params.resetUuid === 'string' ? route.params.resetUuid : route.params.resetUuid[0];
    await resetPassword(uuidParam, newPassword);

    successMessage.value = 'Your password has been reset! Redirecting you to the login page...';
    await wait(2 * 1000);
    router.push('/login');
  } catch (err) {
    errorMessage.value = err;
  } finally {
    isLoading.value = false;
  }
}

checkUuidParam();
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
      for="reset-form-new-password"
      label="Password"
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
