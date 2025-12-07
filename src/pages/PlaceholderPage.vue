<script setup lang="ts">

const props = defineProps<{ title: string }>();

import PorchLayout from 'src/layouts/PorchLayout.vue';
import TextBlurb from 'src/components/layout/TextBlurb.vue';

</script>

<template>
  <PorchLayout>
    <TextBlurb :title="props.title || 'Placeholder'">
      <p>Not sure why you're here. Maybe you're meant to be somewhere else?</p>
    </TextBlurb>
  </PorchLayout>
</template>

<style scoped>
</style>
