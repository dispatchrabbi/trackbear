<script setup lang="ts">
import { ref, onMounted } from 'vue';

import { z } from 'zod';

import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();

import { verifyEmail } from 'src/lib/api/auth.ts';

import AppPage from './layout/AppPage.vue';
import ContentHeader from 'src/components/layout/ContentHeader.vue';

const isLoading = ref<boolean>(false);
const successMessage = ref<string>('');
const errorMessage = ref<string>('');

async function submitVerification() {
  successMessage.value = '';
  errorMessage.value = '';
  isLoading.value = true;

  const routeUuidParam = route.params.uuid as string;
  if(!z.string().uuid().safeParse(routeUuidParam).success) {
    router.push('/');
    return;
  }

  try {
    await verifyEmail(routeUuidParam);
    successMessage.value = 'Your email has been verified! Redirecting you to the login page...';
    // setTimeout(() => router.push('/login'), 3 * 1000);
  } catch(err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  submitVerification();
});

</script>

<template>
  <AppPage>
    <ContentHeader title="Verify Your Email" />
    <VaCard>
      <VaCardContent>
        <div
          v-if="isLoading"
          class="flex justify-center"
        >
          <VaProgressCircle
            indeterminate
            :thickness="0.15"
          />
        </div>
        <VaAlert
          v-if="successMessage"
          class="w-full"
          color="success"
          border="left"
          icon="verified"
          closeable
          :description="successMessage"
        />
        <VaAlert
          v-if="errorMessage"
          class="w-full"
          color="danger"
          border="left"
          icon="error"
          closeable
          :description="errorMessage"
        />
      </VaCardContent>
    </VaCard>
  </AppPage>
</template>

<style scoped>
</style>
