<script setup lang="ts">

import LoggedInAppPage from './layout/LoggedInAppPage.vue';

</script>

<template>
  <LoggedInAppPage>
    <h2 class="va-h2 mb-3">
      Account Settings
    </h2>
    <VaCard>
      <VaCardContent>
        <VaForm class="flex flex-col gap-4">
          <div class="flex gap-4">
            <VaAvatar class="shrink">
              U
            </VaAvatar>
            <VaButton
              class="shrink"
              preset="secondary"
            >
              Upload new avatar
            </VaButton>
          </div>
          <VaInput
            label="Username"
          />
          <VaInput
            label="Display Name"
          />
          <VaInput
            label="Email Address"
          />

          <p class="mt-4">
            To change your password, enter your current password, and then your new password twice. Then hit <b>Save</b>.
          </p>
          <div class="flex gap-4">
            <VaInput
              type="password"
              label="Current Password"
            />
            <VaInput
              type="password"
              label="New Password"
            />
            <VaInput
              type="password"
              label="Confirm New Password"
            />
          </div>

          <div class="flex gap-4 mt-4">
            <VaButton>Save</VaButton>
          </div>
        </VaForm>
      </VaCardContent>
    </VaCard>
  </LoggedInAppPage>
</template>

<style scoped>
</style>
