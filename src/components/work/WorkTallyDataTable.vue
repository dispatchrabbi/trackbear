<script setup lang="ts">
import { computed, defineProps } from 'vue';
import type { Tally } from 'src/lib/api/tally.ts';
import type { Tag } from 'src/lib/api/tag.ts';

import { formatCount } from 'src/lib/tally.ts';

const props = defineProps<{
  tallies: Array<Tally & { tags: Tag[] }>
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
  </DataTable>
</template>

<style scoped>
</style>
