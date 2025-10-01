<script setup lang="ts">
import { ref, reactive, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();
await userStore.populate();

import { useEnvStore } from 'src/stores/env';
const envStore = useEnvStore();

import { z } from 'zod';
import { NonEmptyArray } from 'server/lib/validators.ts';
import { useValidation } from 'src/lib/form.ts';

import { updateSettings, SettingsEditPayload } from 'src/lib/api/me.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
import MultiMeasureInput from 'src/components/project/MultiMeasureInput.vue';
import InputSwitch from 'primevue/inputswitch';
import Dropdown from 'primevue/dropdown';

const emit = defineEmits(['settings:edit', 'formSuccess']);

const formModel = reactive({
  ...userStore.user!.userSettings,
});

const validations = z.object({
  lifetimeStartingBalance: z.record(
    z.enum(Object.keys(TALLY_MEASURE_INFO) as NonEmptyArray<string>),
    z.number({ invalid_type_error: 'Please fill in all balances, or remove blank rows.' }).int({ message: 'Please only enter whole numbers.' }),
  ),
  enablePublicProfile: z.boolean(),
  displayCovers: z.boolean(),
  displayStreaks: z.boolean(),
  weekStartDay: z.number().int().min(0).max(6).default(0),
});

const { ruleFor, validate, isValid, formData } = useValidation(validations, formModel);

const weekStartDayOptions = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const data = formData();
    const updatedUser = await updateSettings(data as SettingsEditPayload);

    emit('settings:edit', { user: updatedUser });
    successMessage.value = `Your settings have been saved.`;
    await wait(1 * 1000);
    emit('formSuccess');
  } catch {
    errorMessage.value = 'Could not save your settings: something went wrong server-side.';

    return;
  } finally {
    isLoading.value = false;
  }
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
      for="settings-form-enable-profile"
      label="Public Profile"
      :rule="ruleFor('enablePublicProfile')"
      :help="``"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="flex gap-4 max-w-full items-center">
          <InputSwitch
            v-model="formModel.enablePublicProfile"
            :invalid="!isFieldValid"
            @update:model-value="onUpdate"
          />
          <div
            class="max-w-64 md:max-w-none"
          >
            {{ formModel.enablePublicProfile ? 'Enabled' : 'Disabled' }}
          </div>
        </div>
      </template>
      <template #help>
        Your public profile shows your avatar, username, display name, lifetime stats, and any projects or goals you add to your profile.
        If enabled, your profile will be accessible at <a
          class="underline text-primary-500 dark:text-primary-400"
          target="_blank"
          :href="`${envStore.env!.URL_PREFIX}/@${userStore.user!.username}`"
        >{{ envStore.env!.URL_PREFIX }}/@{{ userStore.user!.username }}</a>.
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="settings-form-starting-balance"
      label="Pre-TrackBear Totals"
      :rule="ruleFor('lifetimeStartingBalance')"
      help="These totals will be added to your TrackBear totals for your lifetime stats page. Your project starting balances are already counted, so you do not need to account for them here."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <MultiMeasureInput
          id="settings-form-starting-balance"
          v-model="formModel.lifetimeStartingBalance"
          :invalid="!isFieldValid"
          add-button-text="Add Another Total"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="settings-form-display-covers"
      label="Display project covers?"
      :rule="ruleFor('displayCovers')"
      help="Whether to display project covers in the projects list and on project pages."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="flex gap-4 max-w-full items-center">
          <InputSwitch
            v-model="formModel.displayCovers"
            :invalid="!isFieldValid"
            @update:model-value="onUpdate"
          />
          <div
            class="max-w-64 md:max-w-none"
          >
            {{ formModel.displayCovers ? 'Display project covers' : 'Hide project covers' }}
          </div>
        </div>
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="settings-form-display-streaks"
      label="Display streaks?"
      :rule="ruleFor('displayStreaks')"
      help="Whether to display writing streaks on the dashboard."
    >
      <template #default="{ onUpdate, isFieldValid }">
        <div class="flex gap-4 max-w-full items-center">
          <InputSwitch
            v-model="formModel.displayStreaks"
            :invalid="!isFieldValid"
            @update:model-value="onUpdate"
          />
          <div
            class="max-w-64 md:max-w-none"
          >
            {{ formModel.displayStreaks ? 'Display streaks on the Dashboard' : 'Hide streaks on the Dashboard' }}
          </div>
        </div>
      </template>
    </FieldWrapper>
    <FieldWrapper
      for="settings-form-week-start-day"
      label="What day should start the week?"
      :rule="ruleFor('weekStartDay')"
    >
      <template #default="{ onUpdate, isFieldValid }">
        <Dropdown
          v-model="formModel.weekStartDay"
          :invalid="!isFieldValid"
          :options="weekStartDayOptions"
          option-label="label"
          option-value="value"
          @update:model-value="onUpdate"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
