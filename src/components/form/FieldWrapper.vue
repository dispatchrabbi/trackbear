<script setup lang="ts">
import { ref, defineProps } from 'vue';

import { PrimeIcons } from 'primevue/api';

const props = defineProps<{
  label?: string;
  for?: string;
  required?: boolean;
  rule?: (val: unknown) => true | string;
  help?: string;
  info?: string;
}>();

const validationMessage = ref<string | null>(null);
const isFieldValid = ref<boolean>(true);
const onUpdate = function(val) {
  const validationResult = props.rule ? props.rule(val) : true;

  validationMessage.value = validationResult === true ? null : validationResult;
  isFieldValid.value = validationResult === true;
};

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
    <slot
      :on-update="onUpdate"
      :is-field-valid="isFieldValid"
    />
    <slot
      name="message"
      :validation-message="validationMessage"
      :help="help"
    >
      <div
        v-if="!validationMessage"
        class="help-message mt-1 text-sm"
      >
        {{ help }}
      </div>
      <div class="validation-message mt-1 text-sm text-red-500 dark:text-red-400">
        {{ validationMessage }}
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
