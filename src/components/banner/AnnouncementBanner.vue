<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import markdownit from 'markdown-it';

const props = defineProps<{
  message: string;
  color?: string;
  icon?: string;
}>();

const emit = defineEmits(['close']);

const isOpen = ref<boolean>(true);
watch(isOpen, (newVal, oldVal) => {
  if(oldVal === true && newVal === false) {
    emit('close');
  }
});

const md = markdownit({
  html: false,
  xhtmlOut: true,
  linkify: true,
  typographer: true,
});
const messageHtml = computed(() => {
  console.log(md.renderInline(props.message));
  return md.renderInline(props.message);
});

</script>

<template>
  <VaAlert
    v-model="isOpen"
    :icon="props.icon || 'campaign'"
    :color="props.color || 'info'"
    closeable
  >
    <!-- eslint-disable vue/no-v-html -->
    <span
      class="banner-message"
      v-html="messageHtml"
    />
    <!-- eslint-enable vue/no-v-html -->
  </VaAlert>
</template>

<style scoped>
.va-alert {
  --va-alert-margin-y: 0;
  --va-alert-border-radius: 0;
}
</style>
