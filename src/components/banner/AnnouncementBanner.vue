<script setup lang="ts">
import { computed, defineProps, defineEmits } from 'vue';
import markdownit from 'markdown-it';

const props = defineProps<{
  message: string;
  color?: string;
  icon?: string;
}>();

import Message from 'primevue/message';
import MIcon from '../MIcon.vue';

const pt = {
  root: ({ props }) => ({
        class: [
          // Spacing and Shape
          'my-0 mx-0',
          // Colors
          'border-solid border-0 border-l-[6px]',
          // Colors
          {
            'bg-blue-100/70 dark:bg-blue-500/20': props.severity == 'info',
            'bg-green-100/70 dark:bg-green-500/20': props.severity == 'success',
            'bg-orange-100/70 dark:bg-orange-500/20': props.severity == 'warn',
            'bg-red-100/70 dark:bg-red-500/20': props.severity == 'error'
          },
          {
            'border-blue-500 dark:border-blue-400': props.severity == 'info',
            'border-green-500 dark:border-green-400': props.severity == 'success',
            'border-orange-500 dark:border-orange-400': props.severity == 'warn',
            'border-red-500 dark:border-red-400': props.severity == 'error'
          },
        ]
    }),
};

const emit = defineEmits(['close']);

const severity = computed(() => {
  // special-case warning -> warn due to older versions
  if(props.color === 'warning') {
    return 'warn';
  } else if(['info', 'success', 'warn', 'error'].includes(props.color)) {
    return props.color;
  } else {
    return 'info';
  }
});

const onBannerClose = function() {
  emit('close');
};

const md = markdownit({
  html: false,
  xhtmlOut: true,
  linkify: true,
  typographer: true,
});
const messageHtml = computed(() => {
  return md.render(props.message);
});

</script>

<template>
  <Message
    :severity="severity"
    closable
    sticky
    :pt="pt"
    @close="onBannerClose"
  >
    <template #messageicon>
      <span
        v-if="props.icon.startsWith('pi-')"
        :class="[ 'pi', props.icon ]"
      />
      <MIcon
        v-else
        :icon="props.icon || 'campaign'"
        class="text-2xl"
      />
    </template>
    <!-- eslint-disable vue/no-v-html -->
    <div
      class="banner-message mx-2"
      v-html="messageHtml"
    />
    <!-- eslint-enable vue/no-v-html -->
  </Message>
</template>

<style scoped>
</style>
