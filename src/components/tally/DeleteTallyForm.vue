<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { useEventBus } from '@vueuse/core';
import wait from 'src/lib/wait.ts';

import { deleteTally, Tally } from 'src/lib/api/tally.ts';
import { formatCount } from 'src/lib/tally.ts';

import TbForm from 'src/components/form/TbForm.vue';

const props = defineProps<{
  tally: Tally;
}>();
const emit = defineEmits(['tally:delete', 'formSuccess']);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleSubmit() {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const deletedTally = await deleteTally(props.tally.id);

    emit('tally:delete', { tally: deletedTally });
    const tallyEventBus = useEventBus<{ tally: Tally }>('tally:delete');
    tallyEventBus.emit({ tally: deletedTally });

    successMessage.value = `Your progress entry has been deleted.`;
    await wait(1 * 1000);
    emit('formSuccess');
  } catch(err) {
    errorMessage.value = 'Could not delete progress entry: something went wrong server-side.';

    return;
  } finally {
    isLoading.value = false;
  }
}

</script>

<template>
  <TbForm
    :is-valid="true"
    submit-message="Delete"
    submit-severity="danger"
    :loading-message="isLoading ? 'Deleting...' : null"
    :success-message="successMessage"
    :error-message="errorMessage"
    @submit="handleSubmit()"
  >
    <p class="font-bold text-danger-500 dark:text-danger-400">
      You are about to delete {{ formatCount(props.tally.count, props.tally.measure) }}. There is no way to undo this.
    </p>
    <p>To proceed, click Delete.</p>
  </TbForm>
</template>

<style scoped>
</style>
