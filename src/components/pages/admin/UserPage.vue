<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import { useRoute } from 'vue-router';
const route = useRoute();

import { getUser, updateUserState, sendEmailVerificationEmail, sendResetPasswordEmail, User, AuditEvent } from 'src/lib/api/admin/user.ts'
import { USER_STATE } from 'server/lib/models/user.ts';
import { USER_STATE_INFO } from 'src/lib/user.ts';

import AdminLayout from 'src/layouts/AdminLayout.vue';
import DeleteUserForm from 'src/components/account/DeleteUserForm.vue';
import RestoreUserForm from 'src/components/account/RestoreUserForm.vue';
import type { MenuItem } from 'primevue/menuitem';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import { PrimeIcons } from 'primevue/api';

import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
const toast = useToast();

const userId = ref<number>(+route.params.id);
watch(
  () => route.params.id,
  newId => {
    userId.value = +newId;
  }
);

async function loadUser(id: number) {
  const data = await getUser(id);
  user.value = data.user;
  auditEvents.value = data.auditEvents;
}

const user = ref<User | null>(null);
  const auditEvents = ref<AuditEvent[]>([]);
watch(userId, newId => {
  loadUser(newId);
}, { immediate: true });

const breadcrumbs = computed(() => {
  const crumbs: MenuItem[] = [
    { label: 'Admin', url: '/admin' },
    { label: 'Users', url: '/admin/users' },
    { label: user.value === null ? 'Loading...' : `${user.value.username} (${user.value.id})`, url: `/admin/users/${userId.value}` },
  ];

  return crumbs;
});

async function handleActivateClick() {
  toast.add({ summary: 'Activating user...', severity: 'secondary', group: 'activate' });
  try {
    await updateUserState(userId.value, { state: USER_STATE.ACTIVE });
    toast.removeGroup('activate');
    toast.add({ summary: 'User activated', severity: 'success', life: 3000 });
    loadUser(userId.value);
  } catch(err) {
    toast.add({ summary: `Error activating user (${err.code})`, detail: err.message, severity: 'error', life: 3000 });
  }
}

async function handleSuspendClick() {
  toast.add({ summary: 'Suspending user...', severity: 'secondary', group: 'suspend' });
  try {
    await updateUserState(userId.value, { state: USER_STATE.SUSPENDED });
    toast.removeGroup('suspend');
    toast.add({ summary: 'User suspended', severity: 'success', life: 3000 });
    loadUser(userId.value);
  } catch(err) {
    toast.add({ summary: `Error suspending user (${err.code})`, detail: err.message, severity: 'error', life: 3000 });
  }
}

const isDeleteFormVisible = ref<boolean>(false);
function handleDeleteClick() {
  isDeleteFormVisible.value = true;
}

const isRestoreFormVisible = ref<boolean>(false);
function handleRestoreClick() {
  isRestoreFormVisible.value = true;
}

async function handleSendPasswordResetClick() {
  toast.add({ summary: 'Sending password reset email...', severity: 'secondary', group: 'sendReset' });
  try {
    await sendResetPasswordEmail(userId.value)
    toast.removeGroup('sendReset');
    toast.add({ summary: 'Reset email sent!', severity: 'success', life: 3000 });
  } catch(err) {
    toast.add({ summary: `Error sending reset email (${err.code})`, detail: err.message, severity: 'error', life: 3000 });
  }
}

async function handleSendEmailVerificationClick() {
  toast.add({ summary: 'Sending email verification email...', severity: 'secondary', group: 'sendVerify' });
  try {
    await sendEmailVerificationEmail(userId.value)
    toast.removeGroup('sendVerify');
    toast.add({ summary: 'Verification email sent!', severity: 'success', life: 3000 });
  } catch(err) {
    toast.add({ summary: `Error sending verification email (${err.code})`, detail: err.message, severity: 'error', life: 3000 });
  }
}

</script>

<template>
  <AdminLayout
    :breadcrumbs="breadcrumbs"
  >
    <div
      v-if="user !== null"
      class="actions flex justify-end gap-4 mb-4"
    >
      <RouterLink :to="{ name: 'admin-users' }">
        <Button
          :icon="PrimeIcons.ARROW_LEFT"
          severity="secondary"
          text
        />
      </RouterLink>
      <div class="spacer flex-grow" />
      <div class="flex flex-col md:flex-row gap-2">
        <Button
          v-if="user.state === USER_STATE.ACTIVE"
          label="Suspend"
          :icon="PrimeIcons.BAN"
          severity="warning"
          @click="handleSuspendClick"
        />
        <Button
          v-if="user.state === USER_STATE.ACTIVE"
          label="Delete"
          :icon="PrimeIcons.USER_MINUS"
          severity="danger"
          @click="handleDeleteClick"
        />
        <Button
          v-if="user.state === USER_STATE.SUSPENDED"
          label="Activate"
          :icon="PrimeIcons.BOLT"
          severity="success"
          @click="handleActivateClick"
        />
        <Button
          v-if="user.state === USER_STATE.DELETED"
          label="Restore"
          :icon="PrimeIcons.USER_PLUS"
          severity="success"
          @click="handleRestoreClick"
        />
        <Button
          v-if="user.state === USER_STATE.ACTIVE"
          label="Send Password Reset"
          :icon="PrimeIcons.LOCK"
          severity="help"
          outlined
          @click="handleSendPasswordResetClick"
        />
        <Button
          v-if="user.state === USER_STATE.ACTIVE"
          label="Send Email Verification"
          :icon="PrimeIcons.CHECK_CIRCLE"
          :severity="user.isEmailVerified ? 'secondary' : 'help'"
          outlined
          @click="handleSendEmailVerificationClick"
        />
      </div>
    </div>
    <div v-if="user !== null">
      <Card>
        <template #title>
          <div class="flex gap-2 items-center">
            <div class="font-heading font-bold">
              {{ user.username }} (#{{ user.id }})
            </div>
            <Tag
              :value="user.state"
              :severity="USER_STATE_INFO[user.state].color"
              :pt="{ root: { class: 'font-normal uppercase' } }"
              :pt-options="{ mergeSections: true, mergeProps: true }"
            />
          </div>
        </template>
        <template #content>
          <div class="flex flex-wrap items-start gap-8">
            <dl>
              <dt>ID</dt>
              <dd>{{ user.id }}</dd>
              <dt>UUID</dt>
              <dd>{{ user.uuid }}</dd>
              <dt>Username</dt>
              <dd>{{ user.username }}</dd>
              <dt>Display Name</dt>
              <dd>{{ user.displayName }}</dd>
              <dt>Email</dt>
              <dd>
                {{ user.email }}
                <span :class="user.isEmailVerified ? [ PrimeIcons.CHECK_CIRCLE, 'text-green-500 dark:text-green-400' ] : [ PrimeIcons.TIMES_CIRCLE, 'text-red-500 dark:text-red-400' ]" />
              </dd>
            </dl>
            <dl>
              <dt>created</dt>
              <dd>{{ user.createdAt }}</dd>
              <dt>updated</dt>
              <dd>{{ user.updatedAt }}</dd>
            </dl>
          </div>
        </template>
      </Card>
      <pre>{{ JSON.stringify(auditEvents, null, 2) }}</pre>
      <Dialog
        v-model:visible="isDeleteFormVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.USER_MINUS" />
            Delete User
          </h2>
        </template>
        <DeleteUserForm
          :user="user"
          @user:delete="loadUser(user.id)"
          @form-success="isDeleteFormVisible = false"
        />
      </Dialog>
      <Dialog
        v-model:visible="isRestoreFormVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.USER_PLUS" />
            Restore User
          </h2>
        </template>
        <RestoreUserForm
          :user="user"
          @user:restore="loadUser(user.id)"
          @form-success="isRestoreFormVisible = false"
        />
      </Dialog>
    </div>
  </AdminLayout>
  <Toast />
</template>

<style scoped>
dl {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: max-content max-content;
}

dt {
  font-weight: 600; /* semibold */
  margin-right: 0.5rem;
  text-align: right;
}
dt::after {
  content: ':';
}

dd {
  margin: 0;
  grid-column-start: 2;
}
</style>
