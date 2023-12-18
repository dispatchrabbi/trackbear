<script setup lang="ts">
import { ref, reactive } from 'vue';

import { z } from 'zod';
import { useValidation } from '../lib/form.ts';

import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from '../stores/user';
const userStore = useUserStore();

import Page from './layout/AppPage.vue';
import TogglablePasswordInput from './form/TogglablePasswordInput.vue'

const formModel = reactive({
  username: '',
  password: '',
});

const validations = z.object({
  username: z.string().min(1, { message: 'Please enter your username.' }),
  password: z.string().min(1, { message: 'Please enter your password.' }),
});

const { formData, validate, isValid, ruleFor } = useValidation(validations, formModel);

const errorMessage = ref<string>('');

async function handleSubmit() {
  errorMessage.value = '';

  try {
    const { username, password } = formData();
    await userStore.logIn(username, password);
  } catch(err) {
    if(err === 'Incorrect username or password') {
      errorMessage.value = 'Incorrect username or password. Please check and try again.';
    } else {
      errorMessage.value = err;
    }
    return;
  }

  router.push('/projects');
}

</script>

<template>
  <Page>
    <h2 class="va-h2 mb-3">
      Log In
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
            id="username"
            v-model="formModel.username"
            name="username"
            input-aria-label="username"
            autocomplete="username"
            label="Username"
            :rules="[ruleFor('username')]"
          />
          <TogglablePasswordInput
            id="current-password"
            v-model="formModel.password"
            name="current-password"
            autocomplete="current-password"
            label="Password"
            :rules="[ruleFor('password')]"
          />
          <div class="flex gap-4 mt-4">
            <VaButton
              :disabled="!isValid"
              type="submit"
            >
              Log In
            </VaButton>
          </div>
        </VaForm>
      </VaCardContent>
    </VaCard>
  </Page>
</template>

<style scoped>
</style>
