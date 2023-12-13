<script setup lang="ts">
import { ref } from 'vue';
import Page from './page/AppPage.vue';

const password = ref('');
const isPasswordVisible = ref(false);

</script>

<template>
  <Page>
    <h2 class="va-h2 mb-3">
      Log In
    </h2>
    <VaCard>
      <VaCardContent>
        <VaForm class="flex flex-col gap-4">
          <VaInput
            label="Username"
          />
          <VaInput
            id="current-password"
            v-model="password"
            :type="isPasswordVisible ? 'text' : 'password'"
            label="Password"
            autocomplete="current-password"
            @click-append-inner="isPasswordVisible = !isPasswordVisible"
          >
            <template #appendInner>
              <VaIcon
                :name="isPasswordVisible ? 'visibility_off' : 'visibility'"
                size="small"
                color="primary"
              />
            </template>
          </VaInput>
          <div class="flex gap-4 mt-4">
            <VaButton>Log In</VaButton>
          </div>
        </VaForm>
      </VaCardContent>
    </VaCard>
  </Page>
</template>

<style scoped>
</style>
