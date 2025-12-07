<script setup lang="ts">
import { ref, reactive } from 'vue';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { updateMe, type FullUser } from 'src/lib/api/me.ts';

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();

import InputText from 'primevue/inputtext';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const props = defineProps<{
  user: FullUser;
}>();

const formModel = reactive({
  username: props.user.username,
  displayName: props.user.displayName,
  email: props.user.email,
});

const validations = z.object({
  username: z
    .string()
    .min(3, { error: 'Username must be at least 3 characters long.' })
    .max(24, { error: 'Username may not be longer than 24 characters.' })
    .regex(/^[a-z][a-z0-9_-]+$/i, { error: 'Username must start with a letter and only use letters, numbers, underscores, and dashes.' }),
  displayName: z
    .string()
    .min(3, { error: 'Display name must be at least 3 characters long.' })
    .max(24, { error: 'Display name may not be longer than 24 characters.' }),
  email: z.email({ error: 'Please enter a valid email address.' }),
});

const { formData, validate, isValid, ruleFor } = useValidation(validations, formModel);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  if(!validate()) {
    return;
  }

  isLoading.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    const payload = formData();
    await updateMe(payload);
    await userStore.populate(true);

    successMessage.value = 'Saved!';
  } catch (err) {
    errorMessage.value = err.message;
  }

  isLoading.value = false;
}
</script>

<template>
  <TbForm
    :is-valid="isValid"
    submit-label="Save"
    :loading-message="isLoading ? 'Saving...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <FieldWrapper
      for="account-info-form-username"
      label="Username"
      required
      :rule="ruleFor('username')"
      help="Username must be at least 3 characters long and contain only letters, numbers, underscores, and dashes."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="account-info-form-username"
          v-model="formModel.username"
          autocomplete="username"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="account-info-form-displayName"
      label="Display Name"
      required
      :rule="ruleFor('displayName')"
      help="This name is used in group settings, such as on a leaderboard."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="account-info-form-displayName"
          v-model="formModel.displayName"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="account-info-form-email"
      label="Email"
      required
      :rule="ruleFor('email')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <InputText
          id="account-info-form-email"
          v-model="formModel.email"
          autocomplete="email"
          type="email"
          :invalid="!isFieldValid"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
