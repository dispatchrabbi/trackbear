<script setup lang="ts">

const props = defineProps<{
  label?: string;
  required?: boolean;
  message?: string;
}>();

</script>

<template>
  <div
    class="va-input-wrapper va-input-wrapper--labeled va-input"
  >
    <fieldset class="va-input-wrapper__size-keeper">
      <label
        v-if="props.label"
        aria-hidden="true"
        class="va-input-label va-input-wrapper__label va-input-wrapper__label--outer"
        style="color: var(--va-primary);"
      >
        {{ props.label }}
        <span
          v-if="props.required"
          class="required-mark"
        > * </span>
      </label>
      <slot />
    </fieldset>
    <div
      v-if="props.message"
      class="va-message-list"
      role="alert"
    >
      <ul class="va-message-list__list">
        <li class="va-message-list__message">
          {{ message }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.required-mark {
  transform: translate(0, -2px);
  color: var(--va-danger);
  font-size: 18px;
  font-weight: var(--va-input-container-label-font-weight);
  vertical-align: middle;
}
</style>
