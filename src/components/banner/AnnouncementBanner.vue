<script setup lang="ts">
import { computed } from 'vue';
import markdownit from 'markdown-it';

import { PrimeIcons } from 'primevue/api';
import Message from 'primevue/message';

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

const props = defineProps<{
  message: string;
  color?: string;
  icon?: string;
}>();

const emit = defineEmits(['close']);

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
    :icon="props.icon ? `pi ${props.icon}` : PrimeIcons.EXCLAMATION_TRIANGLE"
    :severity="props.color || 'info'"
    :closable="true"
    :sticky="true"
    :pt="pt"
    @close="onBannerClose"
  >
    <!-- eslint-disable vue/no-v-html -->
    <div
      class="banner-message"
      v-html="messageHtml"
    />
    <!-- eslint-enable vue/no-v-html -->
  </Message>
</template>

<style scoped>
.va-alert {
  --va-alert-margin-y: 0;
  --va-alert-border-radius: 0;
}
</style>
