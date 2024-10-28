<script setup lang="ts">
import PorchLayout from 'src/layouts/PorchLayout.vue';
import TextBlurb from 'src/components/layout/TextBlurb.vue';
</script>

<template>
  <PorchLayout>
    <TextBlurb title="Privacy Policy">
      <!-- eslint-disable vue/html-indent vue/max-attributes-per-line vue/singleline-html-element-content-newline -->
      <p>
        I'm gonna be honest with you: I'm just some guy. I don't really have a solid privacy policy for TrackBear —
        just some principles that I intend to follow while running this app. But here's the deal.
      </p>
      <p>
        TrackBear (perhaps ironically) doesn't track you at all, and all data I do collect stays on servers
        controlled by me — absolutely nothing third-party. There are two main places where I collect data: server logs
        and website metrics. Both are to help me troubleshoot and see how people are using the site, and for my own
        curiosity. I will only ever use this data in the service of running TrackBear.
      </p>
      <p>
        Here's exactly what I collect: Server logs use standard Apache combined format, which includes IP
        addresses, User Agent strings, session IDs, Referer headers, and the URL accessed. Website metrics are via a
        self-hosted installation of <a class="underline text-primary-500 dark:text-primary-400" href="https://github.com/plausible/community-edition">Plausible</a> (which is
        specifically designed to be privacy-preserving) and includes the current page, the referrer, and your device's
        screen width (in order to distinguish between mobile and desktop).
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
        did not cover here, please feel free to get in touch!
      </p>
      <!-- eslint-enable vue/html-indent vue/max-attributes-per-line vue/singleline-html-element-content-newline -->
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
