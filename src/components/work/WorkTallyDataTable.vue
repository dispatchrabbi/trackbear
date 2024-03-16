<script setup lang="ts">
import { ref, computed, defineProps } from 'vue';

import { PrimeIcons } from 'primevue/api';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import EditTallyForm from '../tally/EditTallyForm.vue';
import DeleteTallyForm from '../tally/DeleteTallyForm.vue';

import type { TallyWithTags } from 'src/lib/api/tally.ts';

import { formatCount } from 'src/lib/tally.ts';

const props = defineProps<{
  tallies: Array<TallyWithTags>
}>();

const sortedTallies = computed(() => props.tallies.toSorted((a, b) => {
  // most recent first, break ties by createdAt (most recent first)
  return a.date < b.date ? 1 : a.date > b.date ? -1 :
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}));

// TODO: maybe switch to DataView at some point?
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import TbTag from '../tag/TbTag.vue';

const currentlyEditingTally = ref<TallyWithTags>(null);
const isEditFormVisible = computed({
  get: () => currentlyEditingTally.value !== null,
  set: () => currentlyEditingTally.value = null, // nothing sensible to set it to unless it's null
});

const currentlyDeletingTally = ref<TallyWithTags>(null);
const isDeleteFormVisible = computed({
  get: () => currentlyDeletingTally.value !== null,
  set: () => currentlyDeletingTally.value = null, // nothing sensible to set it to unless it's null
});

</script>

<template>
  <DataTable
    :value="sortedTallies"
    sort-field="date"
  >
    <Column
      field="date"
      header="Date"
      sortable
    />
    <Column
      header="Progress"
      class="whitespace-nowrap"
    >
      <template #body="{ data }">
        {{ formatCount(data.count, data.measure) }}
      </template>
    </Column>
    <Column
      field="tags"
      header="Tags"
    >
      <template #body="{ data }">
        <TbTag
          v-for="tag of data.tags"
          :key="tag.id"
          :tag="tag"
          class="mr-1"
        />
      </template>
    </Column>
    <Column
      field="note"
      header="Note"
    />
    <Column
      header=""
      class="w-0 text-center"
    >
      <template #body="{ data }: { data: TallyWithTags }">
        <div class="flex gap-1">
          <Button
            :icon="PrimeIcons.PENCIL"
            severity="secondary"
            text
            rounded
            @click="currentlyEditingTally = data"
          />
          <Button
            :icon="PrimeIcons.TRASH"
            severity="danger"
            text
            rounded
            @click="currentlyDeletingTally = data"
          />
        </div>
      </template>
    </Column>
  </DataTable>
  <Dialog
    v-model:visible="isEditFormVisible"
    modal
  >
    <template #header>
      <h2 class="font-heading font-semibold uppercase">
        <span :class="PrimeIcons.PENCIL" />
        Edit Progress Entry
      </h2>
    </template>
    <EditTallyForm
      :tally="currentlyEditingTally"
      @form-success="currentlyEditingTally = null"
    />
  </Dialog>
  <Dialog
    v-model:visible="isDeleteFormVisible"
    modal
  >
    <template #header>
      <h2 class="font-heading font-semibold uppercase">
        <span :class="PrimeIcons.TRASH" />
        Delete Progress Entry
      </h2>
    </template>
    <DeleteTallyForm
      :tally="currentlyDeletingTally"
      @form-success="currentlyDeletingTally = null"
    />
  </Dialog>
</template>

<style scoped>
</style>
