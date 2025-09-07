<script setup lang="ts">
import { computed } from 'vue';
import markdownit from 'markdown-it';

const props = withDefaults(defineProps<{
  message: string;
  color?: string;
  icon?: string;
}>(), {
  color: 'info',
  icon: 'campaign',
});

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
        'bg-info-100/70 dark:bg-info-500/20': props.severity == 'info',
        'bg-success-100/70 dark:bg-success-500/20': props.severity == 'success',
        'bg-warning-100/70 dark:bg-warning-500/20': props.severity == 'warn',
        'bg-danger-100/70 dark:bg-danger-500/20': props.severity == 'error',
      },
      {
        'border-info-500 dark:border-info-400': props.severity == 'info',
        'border-success-500 dark:border-success-400': props.severity == 'success',
        'border-warning-500 dark:border-warning-400': props.severity == 'warn',
        'border-danger-500 dark:border-danger-400': props.severity == 'error',
      },
    ],
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
        :class="['pi', props.icon]"
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

<style scoped></style>
