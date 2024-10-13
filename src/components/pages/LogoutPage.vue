<script setup lang="ts">
import { ref, onMounted } from 'vue';

import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import Card from 'primevue/card';
import InlineMessage from 'primevue/inlinemessage';
import ProgressSpinner from 'primevue/progressspinner';
import PorchLayout from 'src/layouts/PorchLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';

const logOutError = ref(false);

async function logOut() {
  try {
    await userStore.logOut();
    router.push('/');
  } catch {
    logOutError.value = true;
  }
}

onMounted(() => {
  logOut();
});

</script>

<template>
  <PorchLayout>
    <div class="flex h-full justify-center items-center">
      <Card
        class="flex-auto m-2 md:max-w-2xl"
      >
        <template #title>
          <SectionTitle title="Logging out..." />
        </template>
        <template #content>
          <InlineMessage
            v-if="logOutError"
            severity="warn"
          >
            There was an error logging out. <RouterLink to="/">
              Click here
            </RouterLink> to go to the homepage.
          </InlineMessage>
          <ProgressSpinner
            v-else
          />
        </template>
      </Card>
    </div>
  </PorchLayout>
</template>

<style scoped>
a {
  text-decoration: underline;
}
</style>
