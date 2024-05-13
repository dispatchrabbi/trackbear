<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { Board, starBoard } from 'src/lib/api/board.ts';

const props = defineProps<{
  board: Board;
}>();

const emit = defineEmits(['board:star']);

import Card from 'primevue/card';
import { PrimeIcons } from 'primevue/api';

const isStarLoading = ref<boolean>(false);
async function onStarClick() {
  isStarLoading.value = true;

  const newStarVal = !props.board.starred;
  await starBoard(props.board.uuid, newStarVal);
  isStarLoading.value = false;

  emit('board:star', { uuid: props.board.uuid, starred: newStarVal });
}

</script>

<template>
  <Card
    :pt="{ content: { class: '!py-0' } }"
    :pt-options="{ mergeSections: true, mergeProps: true }"
  >
    <template #title>
      <div class="flex gap-2 items-baseline">
        <span
          :class="[
            isStarLoading ? PrimeIcons.SPINNER + ' pi-spin' : props.board.starred ? PrimeIcons.STAR_FILL : PrimeIcons.STAR,
            'text-primary-500 dark:text-primary-400'
          ]"
          @click.prevent="onStarClick"
        />
        <div>{{ props.board.title }}</div>
      </div>
    </template>
    <template #content>
      <div class="flex flex-col md:flex-row gap-2">
        <div class="font-light italic grow">
          {{ props.board.description }}
        </div>
        <!-- <div>
          {{ describeGoal(props.goal) }}
        </div> -->
      </div>
    </template>
  </Card>
</template>

<style scoped>

</style>
