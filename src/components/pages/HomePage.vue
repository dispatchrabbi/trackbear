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
          Thank you for being part of the alpha test! Even though it could get a bit grizzly, I'm de-panda-ing on your feedback to help me get this writing tracker to a high koala-ty state.
        </p>
        <p>
          Start by signing up for an account by clicking <b>Sign Up</b> in the upper right-hand corner.
        </p>
        <p>
          <b class="text-red-500">IMPORTANT NOTE!</b> This is untested software and, while I will do my best to keep everything intact, I cannot guarantee that your data will not get lost. If you can't bear to lose your progress, track it somewhere else as well.
        </p>
      </TextBlurb>
    </div>
  </PorchLayout>
</template>

<style scoped>
</style>
