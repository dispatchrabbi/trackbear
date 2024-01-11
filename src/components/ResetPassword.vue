<script setup lang="ts">
import { ref, reactive } from 'vue';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();

import { resetPassword } from 'src/lib/api/auth.ts';

import AppPage from './layout/AppPage.vue';
import ContentHeader from 'src/components/layout/ContentHeader.vue';
import TogglablePasswordInput from './form/TogglablePasswordInput.vue';

const formModel = reactive({
  newPassword: '',
});

const validations = z.object({
  newPassword: z.string().min(8, { message: 'Password must be at least 8 characters long.'}),
});

const { formData, validate, isValid, ruleFor } = useValidation(validations, formModel);

const isLoading = ref<boolean>(false);
const successMessage = ref<string>('');
const errorMessage = ref<string>('');

async function handleSubmit() {
  successMessage.value = '';
  errorMessage.value = '';
  isLoading.value = true;

  const routeUuidParam = route.params.uuid as string;
  if(!z.string().uuid().safeParse(routeUuidParam).success) {
    router.push('/');
    return;
  }

  try {
    const { newPassword } = formData();
    await resetPassword(routeUuidParam, newPassword);
    successMessage.value = 'Your password has been reset! Redirecting you to the login page...';
    setTimeout(() => router.push('/login'), 3 * 1000);
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
            To reset your password, enter a new password, then hit <b>Reset Password</b>.
          </p>
          <TogglablePasswordInput
            id="new-password"
            v-model="formModel.newPassword"
            name="new-password"
            autocomplete="new-password"
            label="Password"
            :rules="[ruleFor('newPassword')]"
          />
          <VaAlert
            v-if="successMessage"
            class="w-full"
            color="success"
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
              Reset Password
            </VaButton>
          </div>
        </VaForm>
      </VaCardContent>
    </VaCard>
  </AppPage>
</template>

<style scoped>
</style>
