<script setup lang="ts">
import { ref, reactive, defineEmits, onMounted } from 'vue';
import wait from 'src/lib/wait.ts';

import { useLeaderboardStore } from 'src/stores/leaderboard';
const leaderboardStore = useLeaderboardStore();

import { z } from 'zod';
import { useValidation } from 'src/lib/form.ts';

import { getLeaderboardByJoinCode } from 'src/lib/api/leaderboard';

import InputText from 'primevue/inputtext';
import TbForm from 'src/components/form/TbForm.vue';
import FieldWrapper from 'src/components/form/FieldWrapper.vue';

const props = defineProps<{
  prepopulatedJoinCode?: string;
}>();

const emit = defineEmits(['code:confirm', 'formSuccess']);

const formModel = reactive({
  joinCode: props.prepopulatedJoinCode ?? '',
});

const validations = z.object({
  joinCode: z.string().uuid({ message: 'Please make sure the join code is formatted correctly.' }),
});

const { ruleFor, validate, isValid } = useValidation(validations, formModel);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  if(!validate()) { return; }

  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const leaderboard = await getLeaderboardByJoinCode(formModel.joinCode);

    if(leaderboardStore.get(leaderboard.uuid) !== null) {
      errorMessage.value = `You have already joined this leaderboard.`;
    } else if(!leaderboard.isJoinable) {
      errorMessage.value = `This leaderboard is not currently open to new members. Check with the leaderboard owner if you believe this should not be the case.`;
    } else {
      emit('code:confirm', { code: formModel.joinCode, leaderboard: leaderboard });
      successMessage.value = `Join code confirmed!`;

      await wait(1 * 1000);
      emit('formSuccess');
    }
  } catch (err) {
    if(err.code === 'NOT_FOUND') {
      errorMessage.value = 'This join code is invalid. Check it and try again.';
    } else if(err.code === 'CANNOT_JOIN') {
      errorMessage.value = `This leaderboard is not currently open to new members. Check with the leaderboard owner if you believe this should not be the case.`;
    } else {
      errorMessage.value = 'Could not look up the join code: something went wrong server-side.';
    }
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await leaderboardStore.populate();
});

</script>

<template>
  <TbForm
    :is-valid="isValid"
    submit-label="Submit"
    :loading-message="isLoading ? 'Checking...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="handleSubmit"
  >
    <p>Please enter the leaderboard's Join Code below. If you don't have one, you can get it from the leaderboard's owner.</p>
    <FieldWrapper
      for="board-form-code"
      label="Join Code"
      required
      :rule="ruleFor('joinCode')"
    >
      <template #default>
        <InputText
          id="board-form-code"
          v-model="formModel.joinCode"
          autocomplete="off"
        />
      </template>
    </FieldWrapper>
  </TbForm>
</template>
