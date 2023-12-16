<script setup lang="ts">
import { ref, reactive } from 'vue';
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
});
const errorMessage = ref<string>('');

async function handleSubmit() {
  errorMessage.value = '';

  try {
    await userStore.logIn(loginForm.username, loginForm.password);
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
