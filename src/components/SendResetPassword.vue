<script setup lang="ts">

import Page from './page/AppPage.vue';

</script>

<template>
  <Page>
    <h2 class="va-h2 mb-3">
      Reset Password
    </h2>
    <VaCard>
      <VaCardContent>
        <VaForm class="flex flex-col gap-4">
          <p class="">
            To reset your password, enter your email address here. If there is a matching account, a reset link will be sent to that email address.
          </p>
          <VaInput
            label="Email Address"
          />

          <div class="flex gap-4">
            <VaButton>Send Reset Password Link</VaButton>
          </div>
        </VaForm>
      </VaCardContent>
    </VaCard>
  </Page>
</template>

<style scoped>
</style>
