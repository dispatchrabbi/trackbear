<script setup lang="ts">
import { ref } from 'vue';

import { useRouter } from 'vue-router';
const router = useRouter();

import Card from 'primevue/card';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import UnverifiedEmailMessage from 'src/components/account/UnverifiedEmailMessage.vue';
import AccountInfoForm from 'src/components/account/AccountInfoForm.vue';
import ChangePasswordForm from 'src/components/account/ChangePasswordForm.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';

import { User } from '@prisma/client';
import { getMe } from 'src/lib/api/user.ts';

import type { MenuItem } from 'primevue/menuitem';
const breadcrumbs: MenuItem[] = [
  { label: 'Settings' },
  { label: 'Account', url: '/settings/account' },
];

const user = ref<User>(null);
async function loadUser() {
  try {
    user.value = await getMe();
  } catch(err) {
    router.push('/logout');
  }
}
loadUser();

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div
      v-if="user"
      class="flex flex-col justify-center"
    >
      <div class="m-2 md:max-w-2xl">
        <UnverifiedEmailMessage />
      </div>
      <Card
        class="m-2 md:max-w-2xl"
      >
        <template #title>
          <SectionTitle title="Account Info" />
        </template>
        <template #content>
          <AccountInfoForm
            :user="user"
          />
        </template>
      </Card>
      <Card
        class="m-2 md:max-w-2xl"
      >
        <template #title>
          <SectionTitle title="Password" />
        </template>
        <template #content>
          <ChangePasswordForm />
        </template>
      </Card>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
.not-verified-text {
  color: var(--va-danger);
}
</style>
