<script setup lang="ts">
import { ref, reactive } from 'vue';
import wait from 'src/lib/wait.ts';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { deleteBanner, type Banner } from 'src/lib/api/admin/banner.ts';

import InputText from 'primevue/inputtext';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';
import AnnouncementBanner from './AnnouncementBanner.vue';

const props = defineProps<{
  banner: Banner;
}>();
const emit = defineEmits(['banner:delete', 'formSuccess']);

const formModel = reactive({
  deleteConfirmation: '',
});

const validations = z.object({
  deleteConfirmation: z.string().refine(val => +val === props.banner.id, { error: 'You must type the ID exactly.' }), // only allow exactly the banner ID
});

const { ruleFor, validate, isValid } = useValidation(validations, formModel);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  // let's just make extra sure
  if(!validate()) { return; }

  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const deletedBanner = await deleteBanner(props.banner.id);

    emit('banner:delete', { banner: deletedBanner });
    successMessage.value = `The banner has been deleted.`;
    await wait(1 * 1000);
    emit('formSuccess');
  } catch {
    errorMessage.value = 'Could not delete the banner: something went wrong server-side.';

    return;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <TbForm
    :is-valid="isValid"
    submit-label="Delete"
    submit-severity="danger"
    :loading-message="isLoading ? 'Deleting...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <p class="font-bold text-danger-500 dark:text-danger-400">
      You are about to delete this banner. There is no way to undo this.
    </p>
    <AnnouncementBanner
      :message="props.banner.message"
      :color="props.banner.color"
      :icon="props.banner.icon"
    />
    <p>In order to confirm that you want to delete this banner, please type <span class="font-bold">{{ props.banner.id }}</span> into the input below and click Delete.</p>
    <FieldWrapper
      for="banner-form-confirmation"
      label="Type the ID to confirm deletion:"
      required
      :rule="ruleFor('deleteConfirmation')"
    >
      <template #default>
        <InputText
          id="banner-form-confirmation"
          v-model="formModel.deleteConfirmation"
          autocomplete="off"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
