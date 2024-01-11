<script setup lang="ts">
import { ref, reactive } from 'vue';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { requestPasswordReset } from 'src/lib/api/auth.ts';

import AppPage from './layout/AppPage.vue';
import ContentHeader from 'src/components/layout/ContentHeader.vue';

const formModel = reactive({
  username: '',
});

const validations = z.object({
  username: z.string().min(1, { message: 'Please enter your username.' }),
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
    const { username } = formData();
    await requestPasswordReset(username);
    successMessage.value = 'An email has been sent to your email address with a password reset link.';
  } catch(err) {
    errorMessage.value = err;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <AppPage>
    <ContentHeader title="Reset Password" />
    <VaCard>
      <VaCardContent>
        <VaForm
          ref="form"
          class="flex flex-col gap-4"
          tag="form"
          @submit.prevent="validate() && handleSubmit()"
        >
          <p class="">
            To reset your password, enter your username here. If there is a matching account, a reset link will be sent to that account's email address.
          </p>
          <VaInput
            id="username"
            v-model="formModel.username"
            name="username"
            input-aria-label="username"
            autocomplete="username"
            label="Username"
            :rules="[ruleFor('username')]"
          />
          <VaAlert
            v-if="successMessage"
            class="w-full"
            color="info"
            border="left"
            icon="password"
            closeable
            :description="successMessage"
          />
          <VaAlert
            v-if="errorMessage"
            class="w-full"
            color="danger"
            border="left"
            icon="error"
            closeable
            :description="errorMessage"
          />
          <div class="flex gap-4">
            <VaButton
              :disabled="!isValid"
              :loading="isLoading"
              type="submit"
            >
              Send Link
            </VaButton>
          </div>
        </VaForm>
      </VaCardContent>
    </VaCard>
  </AppPage>
</template>

<style scoped>
</style>
