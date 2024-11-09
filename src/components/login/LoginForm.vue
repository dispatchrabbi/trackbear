<script setup lang="ts">
import { ref, reactive } from 'vue';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { useRouter, RouterLink } from 'vue-router';
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const formModel = reactive({
  username: '',
  password: '',
});

const validations = z.object({
  username: z.string().min(1, { message: 'Please enter your username.' }),
  password: z.string().min(1, { message: 'Please enter your password.' }),
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
    const { username, password } = formData();
    await userStore.logIn(username, password);

    if(router.currentRoute.value.query.redirectTo) {
      router.push(router.currentRoute.value.query.redirectTo.toString());
    } else {
      router.push('/dashboard');
    }
  } catch(err) {
    if(err.code === 'INCORRECT_CREDS') {
      errorMessage.value = 'Incorrect username or password. Please check and try again.';
    } else {
      errorMessage.value = err.message;
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
    submit-message="Log in"
    :loading-message="isLoading ? 'Logging in...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <FieldWrapper
      for="login-form-username"
      label="Username"
      required
      :rule="ruleFor('username')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="login-form-username"
          v-model="formModel.username"
          autocomplete="username"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="login-form-password"
      label="Password"
      required
      :rule="ruleFor('password')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <Password
          id="login-form-password"
          v-model="formModel.password"
          :invalid="!isFieldValid"
          :feedback="false"
          toggle-mask
          :pt="{ input: { root: { class: 'w-full pr-8', autocomplete: 'current-password' } } }"
          :pt-options="{ mergeSections: true, mergeProps: true }"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
  </TbForm>
  <div class="flex gap-2 justify-center mt-4">
    <RouterLink
      :to="{ name: 'send-reset-password' }"
      class="underline text-primary-500 dark:text-primary-400"
    >
      Forgot your password?
    </RouterLink>
    <div>|</div>
    <RouterLink
      :to="{ name: 'signup', query: router.currentRoute.value.query }"
      class="underline text-primary-500 dark:text-primary-400"
    >
      Don't have an account yet?
    </RouterLink>
    <div>|</div>
    <a
      href="https://help.trackbear.app/settings/account"
      target="_blank"
      class="underline text-primary-500 dark:text-primary-400"
    >
      Locked out?
    </a>
  </div>
</template>

<style scoped>
</style>
