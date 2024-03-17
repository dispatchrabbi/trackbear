<script setup lang="ts">
import { RouterLink } from 'vue-router';
import PorchLayout from 'src/layouts/PorchLayout.vue';
import TextBlurb from 'src/components/layout/TextBlurb.vue';
</script>

<template>
  <PorchLayout>
    <TextBlurb
      title="Contact Me"
    >
      <!-- eslint-disable vue/singleline-html-element-content-newline vue/max-attributes-per-line -->
      <h2 class="font-heading font-bold text-xl">
        Need help?
      </h2>
      <p>
        Send an email to me at
        <a class="underline text-primary-500 dark:text-primary-400" href="mailto:trackbearapp+support@gmail.com">trackbearapp+support@gmail.com</a>.
        Please make sure you include your username in the email. I'll try to help you out as much as I can. I'm just a
        dude though, so please keep that in mind both when emailing me and waiting for a response.
      </p>
      <h2 class="font-heading font-bold text-xl mt-4">
        Got a bug to report?
      </h2>
      <p>
        Thanks for being part of the eternal beta test! If you've found a bug, I would love to hear about it. Here are
        things that will make it easier for me to hunt down and fix your bug:
      </p>
      <ul class="list-disc list-inside">
        <li>What were you doing when you saw the bug? What page were you on and what were you trying to do?</li>
        <li>What did you think was supposed to happen?</li>
        <li>What happened instead?</li>
        <li>What do you think the best thing to happen is? (This is sometimes the same as what you thought was going to happen - but not always!)</li>
      </ul>
      <p>
        Send me an email with that information to
        <a class="underline text-primary-500 dark:text-primary-400" href="mailto:trackbearapp+bugs@gmail.com">trackbearapp+bugs@gmail.com</a>
        and I will look into it. If you'd like to be thanked for finding the bug in the
        <RouterLink class="underline text-primary-500 dark:text-primary-400" :to="{ name: 'changelog' }">Changelog</RouterLink>,
        let me know the name by which you'd like to be credited.
      </p>
      <h2 class="font-heading font-bold text-xl mt-4">
        Got an idea for a feature?
      </h2>
      <p>
        I'm happy to hear about how you think TrackBear could be better! Here are some things that will help me
        understand your feature request better (and make it more likely I'll implement it):
      </p>
      <ul class="list-disc list-inside">
        <li>What are you trying to do with TrackBear that this feature will let you do?</li>
        <li>What do you envision this feature looking like when you use it?</li>
        <li>What are the must-have parts of your feature? Which parts are extra?</li>
      </ul>
      <p>
        Send me an email with your feature idea to
        <a class="underline text-primary-500 dark:text-primary-400" href="mailto:trackbearapp+features@gmail.com">trackbearapp+features@gmail.com</a>
        and I will take a look. There are no guarantees that I will implement it: sometimes even good ideas would take
        a lot of prep work and I may just not be able to make it happen. (The "I'm just a dude" rule is in effect here
        too.) But if I do implement your feature, and you'd like to be credited in the
        <RouterLink class="underline text-primary-500 dark:text-primary-400" :to="{ name: 'changelog' }">Changelog</RouterLink>,
        make sure you let me know the name by which you'd like to be credited.
      </p>
      <!-- eslint-enable vue/singleline-html-element-content-newline vue/max-attributes-per-line -->
    </TextBlurb>
  </PorchLayout>
</template>

<style scoped>
</style>
