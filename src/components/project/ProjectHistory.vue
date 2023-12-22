<script setup lang="ts">
import { computed } from 'vue';
import { Project, Update, TYPE_INFO } from '../../lib/project.ts';
import { formatTimeProgress } from '../../lib/date.ts';

const props = defineProps<{ project: Project }>();

function makeRows(project: Project) {
  const countHeader = TYPE_INFO[project.type].description;

  const rows = project.updates
    .sort((a: Update, b: Update) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0)
    .map((update: Update) => ({
      date: update.date,
      [countHeader]: props.project.type === 'time' ? formatTimeProgress(update.value) : update.value,
    }));

  return rows;
}
const items = computed(() => makeRows(props.project));

</script>

<template>
  <VaCard>
    <VaCardTitle>History</VaCardTitle>
    <VaCardContent>
      <VaDataTable
        v-if="items.length"
        :items="items"
      />
      <div
        v-else
        class="text-center"
      >
        Nothing yet. Get writing! 📝
      </div>
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
