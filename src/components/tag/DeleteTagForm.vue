<script setup lang="ts">
import { ref, reactive, defineProps, defineEmits } from 'vue';
import wait from 'src/lib/wait.ts';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { deleteTag, Tag } from 'src/lib/api/tag.ts';

import InputText from 'primevue/inputtext';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const props = defineProps<{
  tag: Tag;
}>();
const emit = defineEmits(['tag:delete', 'formSuccess']);

const formModel = reactive({
  deleteConfirmation: '',
});

const validations = z.object({
  deleteConfirmation: z.string().refine(val => val === props.tag.name, { message: 'You must type the name exactly.',  }), // only allow exactly the work title
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
    const deletedTag = await deleteTag(props.tag.id);

    emit('tag:delete', { work: deletedTag });
    successMessage.value = `${deletedTag.name} has been deleted.`;
    await wait(1 * 1000);
    emit('formSuccess');
  } catch(err) {
    errorMessage.value = 'Could not delete the tag: something went wrong server-side.';

    return;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <TbForm
    :is-valid="isValid"
    submit-message="Delete"
    submit-severity="danger"
    :loading-message="isLoading ? 'Deleting...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="validate() && handleSubmit()"
  >
    <p class="font-bold text-red-500 dark:text-red-400">
      You are about to delete {{ props.tag.name }}. There is no way to undo this.
    </p>
    <p>In order to confirm that you want to delete this tag, please type <span class="font-bold">{{ props.tag.name }}</span> into the input below and click Delete.</p>
    <FieldWrapper
      for="tag-form-confirmation"
      label="Type the name to confirm deletion:"
      required
      :rule="ruleFor('deleteConfirmation')"
    >
      <template #default>
        <InputText
          id="tag-form-confirmation"
          v-model="formModel.deleteConfirmation"
          autocomplete="off"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
