<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { z } from 'zod';

import { useRouter } from 'vue-router';
const router = useRouter();

import AppPage from './layout/AppPage.vue';
import TogglablePasswordInput from './form/TogglablePasswordInput.vue'
import { signUp } from '../lib/api/auth.ts';
import type { CreateUserPayload } from '../../server/api/auth.ts';


const signupForm = reactive({
  username: '',
  email: '',
  newPassword: '',
  confirmPassword: '',
});

const errorMessage = ref('');

// not sure why useForm()'s validate and isValid aren't working but oh well
function validate(): boolean {
  const schema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8).refine(val => val === signupForm.newPassword),
  });

  const result = schema.safeParse(signupForm);
  return result.success;
}
const isValid = computed(() => validate());

async function handleSubmit() {
  errorMessage.value = '';

  const formData = {
    username: signupForm.username,
    email: signupForm.email,
    password: signupForm.newPassword,
  } as CreateUserPayload;

  const status = await signUp(formData);
  if(status === 201) {
    errorMessage.value = 'Sign up successful! Redirecting to login...';
    setTimeout(() => router.push('/login'), 3 * 1000);
  } else if(status === 409) {
    errorMessage.value = 'That username is already taken. Please choose another.';
  } else {
    errorMessage.value = 'Could not sign up; something went wrong server-side.';
  }
}

</script>

<template>
  <AppPage>
    <h2 class="va-h2 mb-3">
      Sign Up
    </h2>
    <VaCard>
      <VaCardContent>
        <VaAlert
          v-if="errorMessage"
          class="mb-4"
          color="danger"
          border="left"
          icon="error"
          closeable
          :description="errorMessage"
        />
        <VaForm
          ref="form"
          class="flex flex-col gap-4"
          tag="form"
          @submit.prevent="validate() && handleSubmit()"
        >
          <VaInput
            v-model="signupForm.username"
            label="Username"
            messages="Required. Must be at least 3 characters long."
            :rules="[v => z.string().min(3).safeParse(v).success || 'Please enter a username at least 3 characters long']"
          />
          <VaInput
            v-model="signupForm.email"
            type="email"
            label="Email"
            messages="Required"
            placeholder="grizzly@example.com"
            :rules="[v => z.string().email().safeParse(v).success || 'Please enter a valid email']"
          />
          <TogglablePasswordInput
            id="new-password"
            v-model="signupForm.newPassword"
            label="Password"
            :rules="[
              v => v.length > 0 || 'Please enter a password',
              v => v.length >= 8 || 'Password must be at least 8 characters long'
            ]"
            autocomplete="new-password"
            messages="Required. Must be at least 8 characters long."
          />
          <TogglablePasswordInput
            id="confirm-password"
            v-model="signupForm.confirmPassword"
            label="Confirm Password"
            :rules="[
              v => v.length > 0 || 'Please enter a password',
              v => v.length >= 8 || 'Password must be at least 8 characters long',
              v => v === signupForm.newPassword || 'Passwords must match'
            ]"
            autocomplete="confirm-password"
            messages="Required. Passwords must match."
          />
          <div class="flex gap-4 mt-4">
            <VaButton
              :disabled="!isValid"
              type="submit"
            >
              Sign Up
            </VaButton>
          </div>
        </VaForm>
      </VaCardContent>
    </VaCard>
  </AppPage>
</template>

<style scoped>
</style>
