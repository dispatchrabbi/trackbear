<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import { useRoute } from 'vue-router';
const route = useRoute();

import { parseISO, format } from 'date-fns';

import { getUser, updateUserState, verifyEmailByFiat, sendEmailVerificationEmail, sendResetPasswordEmail, User, AuditEvent } from 'src/lib/api/admin/user.ts';
import { USER_STATE } from 'server/lib/models/user/consts';
import { USER_STATE_INFO } from 'src/lib/user.ts';

import AdminLayout from 'src/layouts/AdminLayout.vue';
import DeleteUserForm from 'src/components/account/DeleteUserForm.vue';
import RestoreUserForm from 'src/components/account/RestoreUserForm.vue';
import type { MenuItem } from 'primevue/menuitem';
import Card from 'primevue/card';
import Panel from 'primevue/panel';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import { PrimeIcons } from 'primevue/api';

import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
const toast = useToast();

const userId = ref<number>(+route.params.userId);
watch(
  () => route.params.userId,
  newId => {
    if(newId !== undefined) {
      userId.value = +newId;
    }
  },
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
  } catch (err) {
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
  } catch (err) {
    toast.add({ summary: `Error suspending user (${err.code})`, detail: err.message, severity: 'error', life: 3000 });
  }
}

async function handleVerifyClick() {
  toast.add({ summary: 'Verifying user...', severity: 'secondary', group: 'verify' });
  try {
    await verifyEmailByFiat(userId.value);
    toast.removeGroup('verify');
    toast.add({ summary: 'User verified', severity: 'success', life: 3000 });
    loadUser(userId.value);
  } catch (err) {
    toast.add({ summary: `Error verifying user (${err.code})`, detail: err.message, severity: 'error', life: 3000 });
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
    await sendResetPasswordEmail(userId.value);
    toast.removeGroup('sendReset');
    toast.add({ summary: 'Reset email sent!', severity: 'success', life: 3000 });
  } catch (err) {
    toast.add({ summary: `Error sending reset email (${err.code})`, detail: err.message, severity: 'error', life: 3000 });
  }
}

async function handleSendEmailVerificationClick() {
  toast.add({ summary: 'Sending email verification email...', severity: 'secondary', group: 'sendVerify' });
  try {
    await sendEmailVerificationEmail(userId.value);
    toast.removeGroup('sendVerify');
    toast.add({ summary: 'Verification email sent!', severity: 'success', life: 3000 });
  } catch (err) {
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
          label="Verify"
          :icon="PrimeIcons.CHECK_CIRCLE"
          severity="success"
          @click="handleVerifyClick"
        />
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
                <span :class="user.isEmailVerified ? [ PrimeIcons.CHECK_CIRCLE, 'text-success-500 dark:text-success-400' ] : [ PrimeIcons.TIMES_CIRCLE, 'text-danger-500 dark:text-danger-400' ]" />
              </dd>
            </dl>
            <dl>
              <dt>created</dt>
              <dd>{{ format(parseISO(user.createdAt), `d MMM y, HH:mm:ss`) }}</dd>
              <dt>updated</dt>
              <dd>{{ format(parseISO(user.updatedAt), `d MMM y, HH:mm:ss`) }}</dd>
            </dl>
          </div>
        </template>
      </Card>
      <Panel
        header="Audit Events"
        toggleable
        collapsed
        class="mt-2"
      >
        <DataTable :value="auditEvents">
          <Column
            field="id"
            header="ID"
          />
          <Column
            field="sessionId"
            header="Session"
          />
          <Column
            header="Time"
            class="align-right"
          >
            <template #body="{ data }">
              <span class="tabular-nums">
                {{ format(parseISO(data.createdAt), `d MMM y, HH:mm:ss`) }}
              </span>
            </template>
          </Column>
          <Column
            field="eventType"
            header="Event"
          />
          <Column
            field="agentId"
            header="Agent"
          />
          <Column
            field="patientId"
            header="Patient"
          />
          <Column
            field="goalId"
            header="Goal"
          />
          <Column
            header="Aux Info"
          >
            <template #body="{ data }">
              <pre>{{ JSON.stringify(JSON.parse(data.auxInfo), null, 2) }}</pre>
            </template>
          </Column>
        </DataTable>
      </Panel>

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
