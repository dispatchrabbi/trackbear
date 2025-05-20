<script setup lang="ts">
import PorchLayout from 'src/layouts/PorchLayout.vue';
import TextBlurb from 'src/components/layout/TextBlurb.vue';
</script>

<template>
  <PorchLayout>
    <!-- eslint-disable vue/html-indent vue/max-attributes-per-line vue/singleline-html-element-content-newline -->
    <TextBlurb
      title="About TrackBear"
    >
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
        please feel free to <RouterLink class="underline text-primary-500 dark:text-primary-400" :to="{ name: 'contact' }">drop me a message!</RouterLink> And if it's helped you,
        <a class="underline text-primary-500 dark:text-primary-400" href="https://ko-fi.com/trackbear">please
        consider supporting the site</a>. Any money I collect goes directly toward server costs (and also coffee for
        while I'm writing new features for the site).
      </p>
    </TextBlurb>
    <TextBlurb
      title="Acknowledgements"
    >
      <p>
        First of all, a mighty thank you to my alpha testers at the Overachievers (AngelDreamer, aquamoon, Athena,
        Bäumchen, blasionpeach, cardan, cenlyra, einhornlasagne, Elluna, Etlu-Yume, Fiona15351, grav, Kathryn, kdskid007,
        murphy, RavenOFiernan, River, Robot_lurker, sootfire, and SylvirAshe), without whom this site would be very
        different and a whole lot worse.
      </p>
      <p>
        Thank you also to everyone who has written in with a bug, a feature request, or even just a question. If your name
        is on the <RouterLink class="underline text-primary-500 dark:text-primary-400" :to="{ name: 'changelog' }">Changelog</RouterLink>,
        you helped make this site a better experience for everyone!
      </p>
      <p>
        If you are one of the five thousand-odd people (!!!) who gave TrackBear a try before it was even out of
        beta: thank you for taking a chance on a new piece of software. No matter how you're using it, I am glad you found
        it useful enough to stick with.
      </p>
      <p>
        And lastly, a thousand thank yous to my wonderful partner, without whom TrackBear wouldn't even exist. (She even
        suggested the name!) Thank you for the inspiration! It's taken us on a very cool journey.
      </p>
    </TextBlurb>
    <!-- eslint-enable vue/html-indent vue/max-attributes-per-line vue/singleline-html-element-content-newline -->
  </PorchLayout>
</template>

<style scoped>
</style>
