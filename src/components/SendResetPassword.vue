<script setup lang="ts">

import AppPage from './layout/AppPage.vue';
import ContentHeader from 'src/components/layout/ContentHeader.vue';

</script>

<template>
  <AppPage>
    <ContentHeader title="Reset Password" />
    <VaCard>
      <VaCardContent>
        <VaForm class="flex flex-col gap-4">
          <p class="">
            To reset your password, enter your username here. If there is a matching account, a reset link will be sent to that account's email address.
          </p>
          <VaInput
            label="username"
          />

          <div class="flex gap-4">
            <VaButton>Send Reset Password Link</VaButton>
          </div>
        </VaForm>
      </VaCardContent>
    </VaCard>
  </AppPage>
</template>

<style scoped>
</style>
