<script setup lang="ts">
import { ref, reactive } from 'vue';
import wait from 'src/lib/wait.ts';

import { useRouter } from 'vue-router';
const router = useRouter();

import * as z from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { deleteMe } from 'src/lib/api/me.ts';
import { updateUserState } from 'src/lib/api/admin/user.ts';
import { USER_STATE } from 'server/lib/models/user/consts.ts';

import InputText from 'primevue/inputtext';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const props = defineProps<{
  user: { id: number; username: string };
  isSelf?: boolean;
}>();

const emit = defineEmits(['user:delete', 'formSuccess']);

const formModel = reactive({
  deleteConfirmation: '',
});

const validations = z.object({
  deleteConfirmation: z.string().refine(val => val === props.user.username, { error: `You must type ${props.isSelf ? 'your' : 'the'} username exactly.` }),
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
    if(props.isSelf) {
      await deleteMe();
    } else {
      await updateUserState(props.user.id, { state: USER_STATE.DELETED });
    }
    emit('user:delete');

    successMessage.value = `${props.isSelf ? 'Your' : 'The'} account has been deleted.`;
    await wait(1 * 1000);
    emit('formSuccess');

    if(props.isSelf) {
      router.push({ name: 'logout' });
    }
  } catch {
    errorMessage.value = `Could not delete ${props.isSelf ? 'your' : 'the'} account: something went wrong server-side.`;

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
      You are about to delete {{ props.isSelf ? 'your' : 'the' }} account. There is no way to undo this.
    </p>
    <p>In order to confirm that you want to delete {{ props.isSelf ? 'your' : 'the' }} account, please type <span class="font-bold">{{ props.user.username }}</span> into the input below and click Delete.</p>
    <FieldWrapper
      for="goal-form-confirmation"
      :label="`Type ${props.isSelf ? 'your' : 'the'} username to confirm deletion:`"
      required
      :rule="ruleFor('deleteConfirmation')"
    >
      <template #default>
        <InputText
          id="goal-form-confirmation"
          v-model="formModel.deleteConfirmation"
          autocomplete="off"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>

<style scoped>
</style>
