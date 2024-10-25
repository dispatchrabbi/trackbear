<script setup lang="ts">
import { ref } from 'vue';
import wait from 'src/lib/wait.ts';

import { resendVerifyEmail } from 'src/lib/api/auth.ts';

import { PrimeIcons } from 'primevue/api';
import Button from 'primevue/button';
import Message from 'primevue/message';

import { useToast } from 'primevue/usetoast';
const toast = useToast();

const isLoading = ref<boolean>(false);

async function handleClick() {
  isLoading.value = true;

  try {
    await resendVerifyEmail();
    await wait(1 * 1000);

    toast.add({
      severity: 'info',
      detail: 'A new verification link has been sent to your email address.',
      life: 3 * 1000,
    });
  } catch(err) {
    toast.add({
      severity: 'error',
      detail: 'There was an error sending a new verification link.',
      life: 3 * 1000,
    });
  }

  isLoading.value = false;
}
</script>

<template>
  <Message
    severity="warn"
    :closable="false"
    :icon="PrimeIcons.EXCLAMATION_TRIANGLE"
    :pt="{ wrapper: { class: [ '!items-start md:!items-center' ] } }"
    :pt-options="{ mergeSections: true, mergeProps: true }"
  >
    <div class="flex flex-col md:flex-row items-start md:items-center gap-2">
      <div class="flex-auto">
        Your email address is not yet verified. Please check your email for a verification link and click it to verify your email address. If you do not verify your email within 10 days of signing up, your account will be suspended.
      </div>
      <div class="whitespace-nowrap">
        <Button
          severity="warning"
          :label="isLoading ? 'Sending...' : 'Resend verification'"
          :icon="PrimeIcons.SEND"
          :loading="isLoading"
          @click="handleClick"
        />
      </div>
    </div>
  </Message>
</template>

<style scoped>
</style>
