<script setup lang="ts">
import AppPage from 'src/components/layout/AppPage.vue';
import ContentHeader from 'src/components/layout/ContentHeader.vue';
</script>

<template>
  <AppPage>
    <ContentHeader title="Privacy Policy" />
    <VaCard>
      <VaCardContent>
        <p>
          I'm gonna be honest with you: I don't really have a solid privacy policy yet. I'm just some guy. But here's
          the deal.
        </p>
        <p>
          TrackBear (perhaps ironically) doesn't do any tracking of you at all. Not even any analytics on the pages.
          There's some stuff to make the site run and logs so I can troubleshoot and make sure that everything is
          working okay, but absolutely nothing third-party. The only cookies and local storage I use are necessary for
          site functionality (hence no annoying cookie banner) and the app will only email you for transactional
          reasons, like having you confirm your email. If I do ever start sending out newsletters, it'll be easy to
          unsubscribe. As far as the information in the database goes, I will do my best to safeguard it using current
          best practices.
        </p>
        <p>
          That's about it! If you have any further questions, please feel free to get in touch.
        </p>
      </VaCardContent>
    </VaCard>
  </AppPage>
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
