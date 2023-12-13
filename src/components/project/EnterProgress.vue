<script setup lang="ts">
import type { Project } from '../../lib/project.ts';

defineProps<{ project: Project }>()

</script>

<template>
  <VaCard class="h-full">
    <VaCardTitle>How much did you write today?</VaCardTitle>
    <VaCardContent>
      <VaForm class="flex flex-col gap-2">
        <VaInput
          label="words written"
        />
        <VaDateInput
          label="date"
          manual-input
          clearable
        />
        <VaButton class="mt-3">
          Submit
        </VaButton>
      </VaForm>
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
</style>
