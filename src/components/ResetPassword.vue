<script setup lang="ts">

import Page from './page/Page.vue';

</script>

<template>
<Page>
  <h2 class="va-h2 mb-3">Reset Password</h2>
  <VaCard>
    <VaCardContent>
      <VaForm class="flex flex-col gap-4">
        <p class="mt-4">To reset your password, enter a new password, then enter it again to confirm. Then hit <b>Reset Password</b>.</p>
        <div class="flex gap-4">
          <VaInput
            type="password"
            label="New Password"
          ></VaInput>
          <VaInput
            type="password"
            label="Confirm New Password"
          ></VaInput>
        </div>

        <div class="flex gap-4">
          <VaButton>Reset Password</VaButton>
        </div>
      </VaForm>
    </VaCardContent>
  </VaCard>
</Page>
</template>

<style scoped>
</style>
