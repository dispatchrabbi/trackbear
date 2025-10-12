<script setup lang="ts">
import { ref, reactive, defineProps, defineEmits } from 'vue';
import { useEventBus } from '@vueuse/core';
import wait from 'src/lib/wait.ts';

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { deleteProject, type Project } from 'src/lib/api/project';

import InputText from 'primevue/inputtext';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const props = defineProps<{
  project: Project;
}>();
const emit = defineEmits(['project:delete', 'formSuccess']);
const eventBus = useEventBus<{ project: Project }>('project:delete');

const formModel = reactive({
  deleteConfirmation: '',
});

const validations = z.object({
  deleteConfirmation: z.string().refine(val => val === props.project.title, { message: 'You must type the title exactly.' }),
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
    const deletedProject = await deleteProject(props.project.id);

    emit('project:delete', { project: deletedProject });
    eventBus.emit({ project: deletedProject });

    successMessage.value = `${deletedProject.title} has been deleted.`;
    await wait(1 * 1000);

    emit('formSuccess');
  } catch {
    errorMessage.value = 'Could not delete the project: something went wrong server-side.';

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
      You are about to delete {{ props.project.title }}. This will also delete all the progress you've logged on this project. There is no way to undo this.
    </p>
    <p>In order to confirm that you want to delete this project, please type <span class="font-bold">{{ props.project.title }}</span> into the input below and click Delete.</p>
    <FieldWrapper
      for="project-form-confirmation"
      label="Type the title to confirm deletion:"
      required
      :rule="ruleFor('deleteConfirmation')"
    >
      <template #default>
        <InputText
          id="project-form-confirmation"
          v-model="formModel.deleteConfirmation"
          autocomplete="off"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
