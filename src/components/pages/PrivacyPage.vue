<script setup lang="ts">
import PorchLayout from 'src/layouts/PorchLayout.vue';
import TextBlurb from 'src/components/layout/TextBlurb.vue';
</script>

<template>
  <PorchLayout>
    <TextBlurb title="Privacy Policy">
      <p>
        I'm gonna be honest with you: I'm just some guy. I don't really have a solid privacy policy for TrackBear —
        just some principles that I intend to follow while running this app. But here's the deal.
      </p>
      <p>
        TrackBear (perhaps ironically) doesn't do any tracking of you at all. Not even any analytics on the pages.
        There's some stuff to make the site run and logs so I can troubleshoot and make sure that everything is
        working okay, but absolutely nothing third-party. If there is any telemetry on the pages, it'll be entirely for
        the purposes of seeing how people are using the app, mainly so I can make sure that any changes I'm planning
        are actually a good idea.
      </p>
      <p>
        The only cookies and local storage that TrackBear uses are those necessary for site functionality (hence no
        annoying cookie banner) and the app will only email you for transactional reasons, like having you confirm your
        email after you sign up or change your email address. If I do ever start sending out non-transactional emails
        like newsletters, it'll be easy to unsubscribe.
      </p>
      <p>
        As far as the information in the database goes and other technical security things with regards to the backend,
        I will do my best to safeguard TrackBear using current best practices. If you have a specific question that I
        did not cover here, please feel free to get in touch — but please remember that I'm just some guy, doing a
        thing on the internet.
      </p>
    </TextBlurb>
  </PorchLayout>
</template>

<style scoped>
p {
  @apply leading-6;
  @apply mb-4;
}

p:last-child {
  @apply mb-0;
}
</style>
