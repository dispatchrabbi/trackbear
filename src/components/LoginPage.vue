<script setup lang="ts">
import { reactive } from 'vue';
import { useForm } from 'vuestic-ui';

import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from '../stores/user';
const userStore = useUserStore();

import Page from './layout/AppPage.vue';
import TogglablePasswordInput from './form/TogglablePasswordInput.vue'

const { isValid, validate } = useForm('form');

const loginForm = reactive({
  username: '',
  password: '',
  errorMessage: '',
});

async function handleSubmit() {
  loginForm.errorMessage = '';

  try {
    await userStore.logIn(loginForm.username, loginForm.password);
  } catch(err) {
    loginForm.errorMessage = err;
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
    <p>{{ loginForm }}</p>
    <VaCard>
      <VaCardContent>
        <VaForm
          ref="form"
          class="flex flex-col gap-4"
          tag="form"
          @submit.prevent="validate() && handleSubmit()"
        >
          <VaInput
            v-model="loginForm.username"
            label="Username"
            :rules="[v => !!v || 'Please enter your username']"
          />
          <TogglablePasswordInput
            id="current-password"
            v-model="loginForm.password"
            label="Password"
            :rules="[v => !!v || 'Please enter your password']"
            autocomplete="current-password"
          />
          <p v-if="loginForm.errorMessage">
            {{ loginForm.errorMessage }}
          </p>
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
