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
          TrackBear is an app that helps you track your writing projects. You can track in words, chapters, pages, and
          time, which makes it perfect no matter whether you're writing a novel, fanfiction, poetry, a webcomic, or
          anything else. You can also set writing targets and track your writing habits!
        </p>
        <p>
          To get started, click <b>Sign Up</b>!
        </p>
      </TextBlurb>
      <div class="screenshots flex flex-wrap gap-2 max-w-screen-lg mx-auto mb-8">
        <div class="flex-auto">
          <img src="/images/project-words.png">
        </div>
        <div class="flex-auto">
          <img src="/images/project-time.png">
        </div>
        <div class="flex-auto">
          <img src="/images/goal-spring-challenge.png">
        </div>
        <div class="flex-auto">
          <img src="/images/add-progress.png">
        </div>
      </div>
    </div>
  </PorchLayout>
</template>

<style scoped>
.screenshots > div {
  max-width: calc(50% - 0.5rem);
}
</style>
