<script setup lang="ts">
import { ref, reactive } from 'vue';

import AppPage from 'src/components/layout/AppPage.vue';
import ContentHeader from 'src/components/layout/ContentHeader.vue';
import TogglablePasswordInput from 'src/components/form/TogglablePasswordInput.vue';

import { User } from '@prisma/client';
import { getMe } from 'src/lib/api/user.ts';
import { resendVerifyEmail, changePassword } from 'src/lib/api/auth.ts';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

const formModel = reactive({
  username: '',
  displayName: '',
  email: '',
  currentPassword: '',
  newPassword: '',
});

const validations = z.object({
  // username: z
  //   .string()
  //   .min(3, { message: 'Username must be at least 3 characters long.' })
  //   .regex(/^[a-z][a-z0-9_-]+$/i, { message: 'Username must start with a letter and only use letters, numbers, underscores, and dashes.' }),
  // email: z.string().email({ message: 'Please enter a valid email address.' }),
  currentPassword: z.string().min(1, { message: 'Current password is required.'}),
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters long.'}),
});

const { formData, validate, isValid, ruleFor } = useValidation(validations, formModel);

const passwordSuccessMessage = ref<string>('');
const passwordErrorMessage = ref<string>('');
const passwordIsLoading = ref<boolean>(false);
async function handleSubmit() {
  passwordSuccessMessage.value = '';
  passwordErrorMessage.value = '';
  passwordIsLoading.value = true;

  try {
    const { currentPassword, newPassword } = formData();
    await changePassword(currentPassword, newPassword);
    passwordSuccessMessage.value = 'Your password has been changed!';
  } catch(err) {
    if(err.code === 'VALIDATION_FAILED') {
      passwordErrorMessage.value = err.message;
    } else if(err.code === 'INCORRECT_CREDS') {
      passwordErrorMessage.value = 'Current password did not match your actual password. Please check it and try again.';
    } else {
      passwordErrorMessage.value = 'Could not change your password; something went wrong server-side.';
    }
  }

  passwordIsLoading.value = false;
}

const resendSuccessMessage = ref<string>('');
const resendErrorMessage = ref<string>('');
const resendIsLoading = ref<boolean>(false);
async function handleResendVerififcationEmail() {
  resendSuccessMessage.value = '';
  resendErrorMessage.value = '';
  resendIsLoading.value = true;

  try {
    await resendVerifyEmail();
    resendSuccessMessage.value = 'Link sent!';
  } catch(err) {
    resendErrorMessage.value = err.message;
  }

  resendIsLoading.value = false;
}

const user = ref<User>(null);
function loadUser() {
  getMe()
    .then(me => {
      formModel.username = me.username;
      formModel.displayName = me.displayName;
      formModel.email = me.email;

      user.value = me;
    })
    .catch(err => {
      passwordErrorMessage.value = err.message;
    });
}
loadUser();

</script>

<template>
  <AppPage require-login>
    <ContentHeader title="Account Settings" />
    <VaCard>
      <VaCardContent>
        <VaForm
          ref="form"
          class="flex flex-col gap-4"
          tag="form"
          @submit.prevent="validate() && handleSubmit()"
        >
          <!-- <div class="flex gap-4">
            <VaAvatar class="shrink">
              U
            </VaAvatar>
            <VaButton
              class="shrink"
              preset="secondary"
            >
              Upload new avatar
            </VaButton>
          </div> -->
          <VaAlert
            color="info"
            border="top"
            icon="info"
            class="w-full"
          >
            Username, display name, and email address cannot be changed yet.
          </VaAlert>
          <VaInput
            v-model="formModel.username"
            label="Username"
            readonly
          />
          <VaInput
            v-model="formModel.displayName"
            label="Display Name"
            readonly
          />
          <VaInput
            v-model="formModel.email"
            label="Email Address"
            readonly
          />
          <div
            v-if="user && !user.isEmailVerified"
            class="flex items-center -mt-3 flex-col md:flex-row"
          >
            <div class="not-verified-text">
              <VaIcon
                class="-mt-[0.25rem]"
                name="mail_lock"
                color="danger"
                size="large"
              />
              Your email address is not yet verified.
            </div>
            <VaButton
              size="medium"
              :preset="(resendErrorMessage || resendSuccessMessage) ? '' : 'secondary'"
              :border-color="(resendErrorMessage || resendSuccessMessage) ? '' : ''"
              :color="resendErrorMessage ? 'danger' : resendSuccessMessage ? 'success' : 'primary'"
              :icon="resendErrorMessage ? 'error' : resendSuccessMessage ? 'done' : ''"
              class="ml-2"
              :loading="resendIsLoading"
              @click="handleResendVerififcationEmail"
            >
              {{ resendErrorMessage || resendSuccessMessage || 'Resend verification link' }}
            </VaButton>
          </div>
          <p class="mt-4">
            To change your password, enter your current password, and then your new password. Then hit <b>Save</b>.
          </p>
          <TogglablePasswordInput
            id="current-password"
            v-model="formModel.currentPassword"
            label="Current Password"
            :rules="[ruleFor('currentPassword')]"
            name="current-password"
            autocomplete="current-password"
            required-mark
          />
          <TogglablePasswordInput
            id="new-password"
            v-model="formModel.newPassword"
            label="Password"
            :rules="[ruleFor('newPassword')]"
            name="new-password"
            autocomplete="new-password"
            messages="New password must be at least 8 characters long."
            required-mark
          />

          <VaAlert
            v-if="passwordSuccessMessage"
            class="w-full"
            color="success"
            border="left"
            icon="password"
            closeable
            :description="passwordSuccessMessage"
          />
          <VaAlert
            v-if="passwordErrorMessage"
            class="w-full"
            color="danger"
            border="left"
            icon="error"
            closeable
            :description="passwordErrorMessage"
          />
          <div class="flex gap-4">
            <VaButton
              :disabled="!isValid"
              :loading="passwordIsLoading"
              type="submit"
            >
              Save
            </VaButton>
          </div>
        </VaForm>
      </VaCardContent>
    </VaCard>
  </AppPage>
</template>

<style scoped>
.not-verified-text {
  color: var(--va-danger);
}
</style>
