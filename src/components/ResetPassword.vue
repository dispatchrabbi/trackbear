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
          <p class="mt-4">
            To reset your password, enter a new password, then enter it again to confirm. Then hit <b>Reset Password</b>.
          </p>
          <div class="flex gap-4">
            <VaInput
              type="password"
              label="New Password"
            />
            <VaInput
              type="password"
              label="Confirm New Password"
            />
          </div>

          <div class="flex gap-4">
            <VaButton>Reset Password</VaButton>
          </div>
        </VaForm>
      </VaCardContent>
    </VaCard>
  </AppPage>
</template>

<style scoped>
</style>
