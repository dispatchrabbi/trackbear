<script setup lang="ts">
import { ref, reactive } from 'vue';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { useRouter } from 'vue-router';
const router = useRouter();

import AppPage from './layout/AppPage.vue';
import ContentHeader from 'src/components/layout/ContentHeader.vue';
import TogglablePasswordInput from './form/TogglablePasswordInput.vue'
import { signUp } from 'src/lib/api/auth.ts';
import { CreateUserPayload } from 'server/api/auth.ts';

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
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.'}),
});

const { formData, validate, isValid, ruleFor } = useValidation(validations, formModel);

const isLoading = ref<boolean>(false);
const successMessage = ref<string>('');
const errorMessage = ref<string>('');

async function handleSubmit() {
  successMessage.value = '';
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await signUp(formData() as CreateUserPayload);
    successMessage.value = 'Sign up successful! Redirecting to login...';
    setTimeout(() => router.push('/login'), 3 * 1000);
  } catch(err) {
    if(err.code === 'VALIDATION_FAILED') {
      errorMessage.value = err.message;
    } else if(err.code === 'USERNAME_EXISTS') {
      errorMessage.value = 'That username is already taken. Please choose another.';
    } else {
      errorMessage.value = 'Could not sign up; something went wrong server-side.';
    }
  }

  isLoading.value = false;
}

</script>

<template>
  <AppPage>
    <ContentHeader title="Sign Up" />
    <VaCard>
      <VaCardContent>
        <VaAlert
          v-if="successMessage"
          class="mb-4"
          color="success"
          border="left"
          icon="how_to_reg"
          closeable
          :description="successMessage"
        />
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
            id="username"
            v-model="formModel.username"
            label="Username"
            name="username"
            input-aria-label="username"
            autocomplete="username"
            messages="Username must be at least 3 characters long and contain only letters, numbers, underscores, and dashes."
            :rules="[ruleFor('username')]"
            required-mark
          />
          <VaInput
            id="email"
            v-model="formModel.email"
            type="email"
            label="Email"
            name="email"
            input-aria-label="email"
            autocomplete="email"
            placeholder="grizzly@example.com"
            :rules="[ruleFor('email')]"
            required-mark
          />
          <TogglablePasswordInput
            id="new-password"
            v-model="formModel.password"
            label="Password"
            :rules="[ruleFor('password')]"
            name="new-password"
            autocomplete="new-password"
            messages="Password must be at least 8 characters long."
            required-mark
          />
          <div class="flex gap-4 mt-4">
            <VaButton
              :disabled="!isValid"
              :loading="isLoading"
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
