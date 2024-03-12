<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { DataTableColumnSource } from 'vuestic-ui';
import { formatDistanceToNow } from 'date-fns';

import { TYPE_INFO } from 'src/lib/project.ts';
import type { Update } from '@prisma/client';
import type { ProjectWithUpdates } from 'server/api/projects.ts';
import type { SharedProjectWithUpdates } from 'server/api/share.ts';
import { editUpdate, deleteUpdate } from 'src/lib/api/project.ts';
import type { CreateUpdatePayload } from 'server/api/projects.ts';

import { formatDuration, parseDateStringSafe, formatDate, validateTimeString } from 'src/lib/date.ts';

const props = defineProps<{
  project: ProjectWithUpdates | SharedProjectWithUpdates
  allowEdits?: boolean
  showUpdateTimes?: boolean
}>();
const emit = defineEmits(['editUpdate', 'deleteUpdate']);

function makeRows(project: ProjectWithUpdates | SharedProjectWithUpdates) {
  const rows = project.updates
    .sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0)
    .map((update) => ({
      id: props.allowEdits ? (update as Update).id : null,
      date: update.date,
      value: props.project.type === 'time' ? formatDuration(update.value) : update.value,
      updated: props.showUpdateTimes ? (update as Update).updatedAt : null,
    }));

  return rows;
}
const items = computed(() => makeRows(props.project));

const columns = computed(() => {
  const cols = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
    },
    {
      key: 'value',
      label: TYPE_INFO[props.project.type].description,
      sortable: true,
      thAlign: 'right',
      tdAlign: 'right',
    },
  ] as DataTableColumnSource[];

  if(props.allowEdits) {
    cols.push({
      key: 'actions',
      label: '',
      thAlign: 'center',
      tdAlign: 'center',
      width: '80px',
    });
  }

  return cols;
});

const sorting = reactive<{
  sortBy: string;
  sortingOrder: 'asc' | 'desc' | null
}>({
  sortBy: localStorage.getItem('projectHistory:sortBy') || 'date',
  sortingOrder: (localStorage.getItem('projectHistory:sortingOrder') as 'asc' | 'desc') || null,
});
watch(() => sorting.sortBy, val => localStorage.setItem('projectHistory:sortBy', val));
watch(() => sorting.sortingOrder, val => localStorage.setItem('projectHistory:sortingOrder', val));

const isLoading = ref<boolean>(false);

const updateForm = ref<{
  id: number;
  date: Date | null;
  count: string;
} | null>(null);
function validateUpdateForm() {
  if(updateForm.value === null) { return false; }

  const dateIsValid = updateForm.value.date instanceof Date;

  let countIsValid = true;
  let timeIsValid = true;
  if(props.project.type === 'time') {
    timeIsValid = validateTimeString(updateForm.value.count);
  } else {
    countIsValid = updateForm.value.count.length > 0 && Number.isInteger(+updateForm.value.count);
  }

  return dateIsValid && countIsValid && timeIsValid;
}
const isUpdateFormValid = computed(() => validateUpdateForm());

function handleEditClick(updateId) {
  const updateWithThatId = (props.project.updates as Update[]).find(update => update.id === updateId);
  updateForm.value = {
    id: updateWithThatId.id,
    date: parseDateStringSafe(updateWithThatId.date),
    count: props.project.type === 'time' ? formatDuration(updateWithThatId.value, false, true) : updateWithThatId.value.toString(),
  };
}
async function handleSubmitEdit() {
  isLoading.value = true;

  // assemble formData
  const date = formatDate(updateForm.value.date);

  let value;
  if(props.project.type === 'time') {
    const [ hours, minutes ] = updateForm.value.count.split(':').map(x => +x);
    value = (hours * 60) + minutes;
  } else {
    value = +updateForm.value.count;
  }

  const formData = {
    date,
    value,
  } as CreateUpdatePayload;
  const updateId = updateForm.value.id;

  try {
    const editedUpdate = await editUpdate(props.project as ProjectWithUpdates, updateId, formData);
    emit('editUpdate', editedUpdate);

  } catch(err) {
    // errorMessage.value = err.message;
    return;
  } finally {
    updateForm.value = null;
    isLoading.value = false;
  }
}

const updateIdToDelete = ref<number | null>(null);
function handleDeleteClick(updateId) {
  updateIdToDelete.value = updateId;
}
async function handleDeleteConfirmClick() {
  if(updateIdToDelete.value === null) { return; }

  isLoading.value = true;
  try {
    await deleteUpdate(props.project as ProjectWithUpdates, updateIdToDelete.value);
    emit('deleteUpdate', updateIdToDelete.value);

  } catch(err) {
    // errorMessage.value = err.message;
    return;
  } finally {
    updateIdToDelete.value = null;
    isLoading.value = false;
  }
}

</script>

<template>
  <VaCard>
    <VaCardTitle>History</VaCardTitle>
    <VaCardContent>
      <VaDataTable
        v-if="items.length"
        v-model:sort-by="sorting.sortBy"
        v-model:sorting-order="sorting.sortingOrder"
        :items="items"
        :columns="columns"
      >
        <template #cell(date)="{ value, rowData }">
          {{ value }}
          <VaPopover
            v-if="props.showUpdateTimes"
            placement="top"
            :message="`${formatDistanceToNow(rowData.updated)} ago`"
          >
            <VaIcon
              name="history"
              size="small"
              class="mb-1"
            />
          </VaPopover>
        </template>
        <template #cell(actions)="{ rowData }">
          <div
            v-if="props.allowEdits"
            class="flex justify-center gap-2"
          >
            <VaButton
              preset="plain"
              icon="edit"
              class="shrink"
              @click="handleEditClick(rowData.id)"
            />
            <VaButton
              preset="plain"
              icon="delete"
              class="shrink"
              @click="handleDeleteClick(rowData.id)"
            />
          </div>
        </template>
      </VaDataTable>
      <div
        v-else
        class="text-center"
      >
        Nothing yet. Get writing! 📝
      </div>
    </VaCardContent>
  </VaCard>
  <VaModal
    class="edit-update-modal"
    :model-value="!!updateForm"
    hide-default-actions
  >
    <VaForm
      ref="form"
      class="flex flex-col gap-2"
      tag="form"
    >
      <VaInput
        v-model="updateForm.count"
        :label="TYPE_INFO[props.project.type].description"
        :rules="props.project.type === 'time' ?
          [(v) => validateTimeString(v) || 'Please enter a duration in hours and minutes'] :
          [v => { return (v === '') || (Number.parseInt(v, 10) === +v) || ('Please enter a number for your progress') }]
        "
        :placeholder="props.project.type === 'time' ? 'HH:MM' : null"
        required-mark
      />
      <VaDateInput
        v-model="updateForm.date"
        label="date"
        placeholder="YYYY-MM-DD"
        :format="formatDate"
        :parse="parseDateStringSafe"
        required-mark
        manual-input
        clearable
      />
    </VaForm>
    <template #footer>
      <VaButton
        class="mr-3"
        preset="secondary"
        @click="updateForm = null"
      >
        Cancel
      </VaButton>
      <VaButton
        :disabled="!isUpdateFormValid"
        :loading="isLoading"
        @click="validateUpdateForm() && handleSubmitEdit()"
      >
        Save
      </VaButton>
    </template>
  </VaModal>
  <VaModal
    class="delete-update-modal"
    :model-value="!!updateIdToDelete"
    hide-default-actions
  >
    <div>
      Are you sure you want to delete this update?
    </div>
    <template #footer>
      <VaButton
        class="mr-3"
        preset="secondary"
        @click="updateIdToDelete = null"
      >
        Cancel
      </VaButton>
      <VaButton
        color="danger"
        :loading="isLoading"
        @click="handleDeleteConfirmClick"
      >
        Delete
      </VaButton>
    </template>
  </VaModal>
</template>

<style scoped>
</style>
