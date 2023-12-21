<script setup lang="ts">
import AppPage from './layout/AppPage.vue';
</script>

<template>
  <AppPage>
    <h2 class="va-h2 mb-3">
      About TrackBear
    </h2>
    <VaCard>
      <VaCardContent>
        <p>
          It all started with a spreadsheet. My partner wondered aloud if there was some way she could track her
          yearly writing goal in a spreadsheet, with nice graphs and stats and things. Then, frustration vented, she
          moved on to other things. Three hours later, I sent her a link to Google Sheets and waited to see how she
          liked it. She still says it's one of the best gifts I've ever gotten her.
        </p>
        <p>
          Years later, after a particularly successful NaNoWriMo, my partner faced the prospect of editing a whole novel
          for the very first time. Tracking words written is straightforward — and fairly standard among writers — but
          everyone has a different way to track editing. In the meantime, she had sent The Spreadsheet to several of
          her writer friends and they had come back with feedback, suggestions, and requests. And others had chimed in
          to note that there was no good way to have a writing challenge and keep track of how your friends were doing.
        </p>
        <p>
          So one day in December, when I was planning to tackle that day's Advent of Code puzzle, I instead sat down
          and started planning out the webapp that would become TrackBear. I've had a lot of fun figuring out how best
          to build this app and learned some new skills along the way.
        </p>
        <p>
          I hope TrackBear works for whatever your writerly needs happen to be. If you liked it, or you have feedback,
          please feel free to drop me a message! And if it's helped you, please consider supporting the site. Any money
          I collect goes directly toward server costs (and also coffee while I'm writing new features for the site).
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
