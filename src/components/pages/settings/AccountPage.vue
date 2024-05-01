<script setup lang="ts">
import { ref } from 'vue';

import { useRouter } from 'vue-router';
const router = useRouter();

import Panel from 'primevue/panel';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ApplicationLayout from 'src/layouts/ApplicationLayout.vue';
import UnverifiedEmailMessage from 'src/components/account/UnverifiedEmailMessage.vue';
import AccountInfoForm from 'src/components/account/AccountInfoForm.vue';
import ChangePasswordForm from 'src/components/account/ChangePasswordForm.vue';
import DeleteUserForm from 'src/components/account/DeleteUserForm.vue';

import { User } from '@prisma/client';
import { getMe } from 'src/lib/api/me.ts';

import type { MenuItem } from 'primevue/menuitem';
import { PrimeIcons } from 'primevue/api';
const breadcrumbs: MenuItem[] = [
  { label: 'Settings' },
  { label: 'Account', url: '/settings/account' },
];

const isDeleteFormVisible = ref<boolean>(false);

const user = ref<User>(null);
async function loadUser() {
  try {
    user.value = await getMe();
  } catch(err) {
    router.push('/logout');
  }
}
await loadUser();

</script>

<template>
  <ApplicationLayout
    :breadcrumbs="breadcrumbs"
  >
    <div
      v-if="user"
      class="flex flex-col justify-center max-w-screen-md"
    >
      <div
        v-if="!user.isEmailVerified"
        class="m-2"
      >
        <UnverifiedEmailMessage />
      </div>
      <Panel
        header="Account Info"
        class="m-2"
      >
        <AccountInfoForm
          :user="user"
        />
      </Panel>
      <Panel
        header="Change Password"
        class="m-2"
      >
        <ChangePasswordForm />
      </Panel>
      <Panel
        header="Danger Zone"
        class="m-2"
        toggleable
        collapsed
        :pt="{ header: { class: '!bg-danger-200 dark:!bg-danger-900' } }"
        :pt-options="{ mergeSections: true, mergeProps: true }"
      >
        <Button
          label="Delete account"
          severity="danger"
          size="large"
          :icon="PrimeIcons.TIMES_CIRCLE"
          @click="isDeleteFormVisible = true"
        />
        <Dialog
          v-model:visible="isDeleteFormVisible"
          modal
        >
          <template #header>
            <h2 class="font-heading font-semibold uppercase">
              <span :class="PrimeIcons.USER_MINUS" />
              Delete Your Account
            </h2>
          </template>
          <DeleteUserForm
            :user="user"
            is-self
            @form-success="router.push({ name: 'logout' })"
          />
        </Dialog>
      </Panel>
    </div>
  </ApplicationLayout>
</template>

<style scoped>
.not-verified-text {
  color: var(--va-danger);
}
</style>
