<script setup lang="ts">
import { ref, reactive, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';

import { useUserStore } from 'src/stores/user.ts';
const userStore = useUserStore();
await userStore.populate();

import { z } from 'zod';
import { NonEmptyArray } from 'server/lib/validators.ts';
import { useValidation } from 'src/lib/form.ts';

import { updateSettings, SettingsEditPayload } from 'src/lib/api/me.ts';
import { TALLY_MEASURE_INFO } from 'src/lib/tally.ts';

import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
import MultiMeasureInput from 'src/components/work/MultiMeasureInput.vue';

const emit = defineEmits(['settings:edit', 'formSuccess']);

const formModel = reactive({
  ...userStore.user.userSettings,
});

const validations = z.object({
  lifetimeStartingBalance: z.record(
    z.enum(Object.keys(TALLY_MEASURE_INFO) as NonEmptyArray<string>),
    z.number({ invalid_type_error: 'Please fill in all balances, or remove blank rows.' }).int({ message: 'Please only enter whole numbers.' })
  ),
});

const { ruleFor, validate, isValid, formData } = useValidation(validations, formModel);

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
    successMessage.value = `Your settings have been updated.`;
    await wait(1 * 1000);
    emit('formSuccess');
  } catch(err) {
    errorMessage.value = 'Could not update your settings: something went wrong server-side.';

    return;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <TbForm
    :is-valid="isValid"
    submit-message="Submit"
    :loading-message="isLoading ? 'Creating...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <FieldWrapper
      for="settings-form-starting-balance"
      label="Pre-TrackBear Totals"
      :rule="ruleFor('lifetimeStartingBalance')"
      help="These totals will be added to your TrackBear totals for your lifetime stats page."
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
  </TbForm>
</template>

<style scoped>
</style>
