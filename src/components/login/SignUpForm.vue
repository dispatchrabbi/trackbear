<script setup lang="ts">
import { ref, reactive } from 'vue';
import wait from 'src/lib/wait.ts';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { useRouter } from 'vue-router';
const router = useRouter();

import { signUp } from 'src/lib/api/auth.ts';
import { CreateUserPayload } from 'server/api/auth.ts';

import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const formModel = reactive({
  username: '',
  email: '',
  password: '',
});

const validations = z.object({
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters long.' })
    .regex(/^[a-z][a-z0-9_-]+$/i, { message: 'Username must start with a letter and only use letters, numbers, underscores, and dashes.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
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
    await signUp(formData() as CreateUserPayload);

    successMessage.value = 'Sign up successful! Redirecting to login...';
    await wait(1 * 1000);
    router.push({ name: 'login', query: router.currentRoute.value.query });
  } catch (err) {
    if(err.code === 'VALIDATION_FAILED') {
      errorMessage.value = err.message;
    } else if(err.code === 'USERNAME_EXISTS') {
      errorMessage.value = 'That username is already taken. Please choose another.';
    } else {
      errorMessage.value = 'Could not sign up: something went wrong server-side.';
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
    submit-label="Sign up"
    :loading-message="isLoading ? 'Signing up' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <FieldWrapper
      for="signup-form-username"
      label="Username"
      required
      :rule="ruleFor('username')"
      help="Username must be at least 3 characters long and contain only letters, numbers, underscores, and dashes."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="signup-form-username"
          v-model="formModel.username"
          autocomplete="username"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="signup-form-email"
      label="Email"
      required
      :rule="ruleFor('email')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="signup-form-email"
          v-model="formModel.email"
          autocomplete="email"
          type="email"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="signup-form-new-password"
      label="Password"
      required
      :rule="ruleFor('password')"
      help="Password must be at least 8 characters long."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <Password
          id="signup-form-new-password"
          v-model="formModel.password"
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
