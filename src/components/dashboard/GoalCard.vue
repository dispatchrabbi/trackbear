<script setup lang="ts">
import { defineProps } from 'vue';

import { Goal } from 'src/lib/api/goal.ts';
import { describeGoal } from 'src/lib/goal.ts';

import Card from 'primevue/card';

const props = defineProps<{
  goal: Goal;
}>();
</script>

<template>
  <Card
    class="max-w-full"
    :pt="{
      content: { class: 'py-0 px-5 md:px-6' }
    }"
  >
    <template #title>
      <div class="flex items-baseline justify-between gap-2">
        <div>{{ props.goal.title }}</div>
        <slot name="comment" />
      </div>
      <div class="font-light italic text-sm">
        {{ describeGoal(props.goal) }}
      </div>
    </template>
    <template #content>
      <slot name="content" />
    </template>
  </Card>
</template>
