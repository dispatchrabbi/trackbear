<script setup lang="ts">
import { ref } from 'vue';

import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();
await userStore.populate();

import { deleteAvatar } from 'src/lib/api/me.ts';

import { PrimeIcons } from 'primevue/api';
import Panel from 'primevue/panel';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import type { MenuItem } from 'primevue/menuitem';

import SettingsLayout from 'src/layouts/SettingsLayout.vue';
import UnverifiedEmailMessage from 'src/components/account/UnverifiedEmailMessage.vue';
import AccountInfoForm from 'src/components/account/AccountInfoForm.vue';
import UploadAvatarForm from 'src/components/account/UploadAvatarForm.vue';
import ChangePasswordForm from 'src/components/account/ChangePasswordForm.vue';
import DeleteUserForm from 'src/components/account/DeleteUserForm.vue';
import UserAvatar from 'src/components/avatar/UserAvatar.vue';

import { useConfirm } from 'primevue/useconfirm';
import DangerPanel from 'src/components/layout/DangerPanel.vue';
const confirm = useConfirm();

const breadcrumbs: MenuItem[] = [
  { label: 'Account', url: '/account' },
];

const isUploadFormVisible = ref<boolean>(false);
const isDeleteFormVisible = ref<boolean>(false);

function handleRemoveAvatar(ev) {
  confirm.require({
    target: ev.currentTarget,
    message: 'Are you sure you want to remove your current avatar?',
    acceptClass: '!bg-danger-500 dark:!bg-danger-400 !border-danger-500 dark:!border-danger-400 !ring-danger-500 dark:!ring-danger-400 hover:!bg-danger-600 dark:hover:!bg-danger-300 hover:!border-danger-600 dark:hover:!border-danger-300 focus:!ring-danger-400/50 dark:!focus:ring-danger-300/50',
    rejectClass: '!text-surface-500 dark:!text-surface-400',
    accept: async () => {
      await deleteAvatar();
      userStore.populate(true);
    },
  });
};

function handleClickExport() {
  window.open('/export/progress');
}

</script>

<template>
  <SettingsLayout
    :breadcrumbs="breadcrumbs"
  >
    <div
      v-if="userStore.user"
      class="flex flex-col justify-center max-w-screen-md"
    >
      <div
        v-if="!userStore.user.isEmailVerified"
        class="m-2"
      >
        <UnverifiedEmailMessage />
      </div>
      <Panel
        header="Account Info"
        class="m-2"
      >
        <AccountInfoForm
          :user="userStore.user"
        />
      </Panel>
      <Panel
        header="Avatar"
        class="m-2"
      >
        <div class="flex items-center gap-2">
          <UserAvatar
            :user="userStore.user"
            size="xlarge"
          />
        </div>
        <div class="flex items-center mt-4 gap-2">
          <Button
            label="Upload"
            size="large"
            :icon="PrimeIcons.UPLOAD"
            @click="isUploadFormVisible = true"
          />
          <Button
            v-if="userStore.user.avatar"
            label="Remove"
            severity="danger"
            size="large"
            :icon="PrimeIcons.TRASH"
            @click="ev => handleRemoveAvatar(ev)"
          />
        </div>
        <Dialog
          v-model:visible="isUploadFormVisible"
          modal
        >
          <template #header>
            <h2 class="font-heading font-semibold uppercase">
              <span :class="PrimeIcons.UPLOAD" />
              Upload Avatar
            </h2>
          </template>
          <UploadAvatarForm
            :username="userStore.user.username"
            @user:avatar="userStore.populate(true)"
            @form-success="isUploadFormVisible = false"
          />
        </Dialog>
      </Panel>
      <Panel
        header="Change Password"
        class="m-2"
      >
        <ChangePasswordForm />
      </Panel>
      <Panel
        header="Export Data"
        class="m-2"
      >
        <div class="flex flex-col gap-4">
          <div>
            <p>Click the button below to download all your TrackBear data. The download is a zip file which includes:</p>
            <ul>
              <li>A CSV file with all your progress</li>
              <li>One CSV file per project, listing the progress for that project</li>
              <li>One CSV file per target goal, listing the daily progress for the target</li>
              <li>One CSV file per habit goal, listing the progress for each habit</li>
              <li>A JSON file that includes all the progress entries, projects, tags, targets, and habits</li>
            </ul>
          </div>
          <div>
            <Button
              label="Export your data"
              size="large"
              @click="handleClickExport"
            />
          </div>
        </div>
      </Panel>
      <DangerPanel
        header="Danger Zone"
        class="m-2"
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
            :user="userStore.user"
            is-self
            @form-success="router.push({ name: 'logout' })"
          />
        </Dialog>
      </DangerPanel>
    </div>
  </SettingsLayout>
</template>

<style scoped>
.not-verified-text {
  color: var(--va-danger);
}

ul > li {
  list-style: disc;
  list-style-position: inside;
}
</style>
