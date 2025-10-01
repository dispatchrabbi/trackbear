<script setup lang="ts">
import { PrimeIcons } from 'primevue/api';

const props = withDefaults(defineProps<{
  label?: string;
  for?: string;
  required?: boolean;
  errorMessage?: string | null;
  help?: string | null;
  info?: string | null;
}>(), {
  label: undefined,
  for: undefined,
  required: false,
  errorMessage: undefined,
  help: undefined,
  info: undefined,
});

</script>

<template>
  <fieldset>
    <label
      v-if="props.label"
      :for="props.for"
      class="text-xs uppercase font-light mb-1"
    >
      {{ props.label }}
      <span
        v-if="props.required"
        class="required-mark"
      > * </span>
      <span
        v-if="props.info"
        v-tooltip="props.info"
        :class="PrimeIcons.QUESTION_CIRCLE"
      />
    </label>
    <slot />
    <slot
      name="message"
      :error-message="props.errorMessage"
      :help="props.help"
    >
      <div
        v-if="!props.errorMessage"
        class="help-message mt-1 text-sm"
      >
        <slot
          name="help"
          :help="props.help"
        >
          {{ props.help }}
        </slot>
      </div>
      <div class="validation-message mt-1 text-sm text-danger-500 dark:text-danger-400">
        {{ props.errorMessage }}
      </div>
    </slot>
  </fieldset>
</template>

<style scoped>
fieldset {
  display: flex;
  flex-direction: column;
}

fieldset > label {
  display: block;
}
.required-mark {
  transform: translate(0, -2px);
  color: rgb(var(--primary-500));
}
</style>
