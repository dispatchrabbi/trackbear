<script setup lang="ts">
import { onMounted } from 'vue';

import PorchLayout from 'src/layouts/PorchLayout.vue';
import TextBlurb from 'src/components/layout/TextBlurb.vue';

const KOFI_URL = 'https://ko-fi.com/trackbear';
onMounted(() => {
  window.location.href = KOFI_URL;
});
</script>

<template>
  <PorchLayout>
    <TextBlurb
      title="Redirecting to the TrackBear Ko-Fi page..."
    >
      <!-- eslint-disable vue/html-indent vue/max-attributes-per-line-->
      <p>
        Thanks for supporting TrackBear! You should be redirected to the TrackBear Ko-Fi page in just a second. If you
        aren't, <a :href="KOFI_URL">please click here</a>.
      </p>
      <!-- eslint-enable vue/html-indent vue/max-attributes-per-line-->
    </TextBlurb>
  </PorchLayout>
</template>

<style scoped>
</style>
