<script setup lang="ts">
import PorchLayout from 'src/layouts/PorchLayout.vue';
import TextBlurb from 'src/components/layout/TextBlurb.vue';
</script>

<template>
  <PorchLayout>
    <div class="homepage">
      <div class="hero">
        <img
          src="/images/hans-jurgen-mager_qQWV91TTBrE_polar-bear-waving_992.jpg"
          class="object-cover object-[center_15%] max-h-96 w-full"
          title="Photo by Hans-Jurgen Mager on Unsplash"
          alt="A picture of a polar bear standing on its hind legs with a paw raised as if in greeting"
        >
      </div>
      <TextBlurb title="Welcome to TrackBear!">
        <p>
          TrackBear is an app that helps you track your writing. You can track word count, time spent, and chapters
          and pages written. You can also set writing progress goals and track writing habit streaks!
        </p>
        <p>
          To get started, click <b>Sign Up</b>!
        </p>
      </TextBlurb>
    </div>
  </PorchLayout>
</template>

<style scoped>
</style>
