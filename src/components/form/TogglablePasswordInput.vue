<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ValidationRule } from 'vuestic-ui';

const props = defineProps<{
  modelValue: string;
  id: string;
  autocomplete: string;
  label?: string;
  rules?: ValidationRule<string>[];
  messages?: string | [];
}>();

const emit = defineEmits(['update:modelValue']);

const value = computed({
  get() {
    return props.modelValue;
  },
  set(val) { emit('update:modelValue', val); }
});
const isPasswordVisible = ref(false);
</script>

<template>
  <VaInput
    :id="props.id"
    v-model="value"
    :type="isPasswordVisible ? 'text' : 'password'"
    :label="props.label"
    :rules="props.rules"
    :messages="props.messages"
    :autocomplete="props.autocomplete"
    @click-append-inner="isPasswordVisible = !isPasswordVisible"
  >
    <template #appendInner>
      <VaIcon
        class="cursor-pointer"
        :name="isPasswordVisible ? 'visibility_off' : 'visibility'"
        size="small"
        color="primary"
      />
    </template>
  </VaInput>
</template>
