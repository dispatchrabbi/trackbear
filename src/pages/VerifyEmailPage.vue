<script setup lang="ts">
import { ref, onMounted } from 'vue';
import wait from 'src/lib/wait.ts';

import { z } from 'zod';

import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();

import { verifyEmail } from 'src/lib/api/auth.ts';

import Card from 'primevue/card';
import InlineMessage from 'primevue/inlinemessage';
import ProgressSpinner from 'primevue/progressspinner';
import PorchLayout from 'src/layouts/PorchLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

function checkUuidParam() {
  if(!z.uuid().safeParse(route.params.verifyUuid).success) {
    router.push('/');
    return false;
  } else {
    return true;
  }
}

async function submitVerification() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const uuidParam = typeof route.params.verifyUuid === 'string' ? route.params.verifyUuid : route.params.verifyUuid[0];
    await verifyEmail(uuidParam);

    successMessage.value = 'Your email has been verified! Redirecting you to the login page...';
    await wait(2 * 1000);
    router.push('/login');
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  if(checkUuidParam()) {
    submitVerification();
  }
});

</script>

<template>
  <PorchLayout>
    <div class="flex h-full justify-center items-center">
      <Card
        class="flex-auto m-2 md:max-w-2xl"
      >
        <template #title>
          <SectionTitle title="Verifying your email..." />
        </template>
        <template #content>
          <ProgressSpinner
            v-if="isLoading"
          />
          <InlineMessage
            v-if="successMessage"
            severity="success"
          >
            {{ successMessage }}
          </InlineMessage>
          <InlineMessage
            v-if="errorMessage"
            severity="error"
          >
            {{ errorMessage }}
          </InlineMessage>
        </template>
      </Card>
    </div>
  </PorchLayout>
</template>

<style scoped>
</style>
