<script setup lang="ts">
const props = defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <header
    :class="[
      'mb-4 flex md:flex-row gap-4 items-start justify-between md:justify-start',
      {'flex-row-reverse': $slots.image}
    ]"
  >
    <div
      v-if="$slots.image"
      class="cover-image flex-none max-h-48 max-w-32"
    >
      <slot name="image" />
    </div>
    <div class="header-info flex flex-col items-start">
      <h1 class="text-2xl font-bold font-heading text-balance">
        {{ props.title }}
      </h1>
      <h2
        v-if="props.subtitle"
        class="font-heading italic font-light text-balance"
      >
        {{ props.subtitle }}
      </h2>
      <div
        v-if="$slots.actions"
        class="flex flex-col md:flex-row gap-2 mt-2"
      >
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
