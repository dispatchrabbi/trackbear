<script setup lang="ts">
import { computed } from 'vue';

import { useTheme } from 'src/lib/theme';
const { theme } = useTheme();

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
const breakpoints = useBreakpoints(breakpointsTailwind);

const size = computed(() => {
  return breakpoints.smaller('md').value ? 'mobile' : 'desktop';
});

import PorchLayout from 'src/layouts/PorchLayout.vue';
import TextBlurb from 'src/components/layout/TextBlurb.vue';
import { RouterLink } from 'vue-router';
import Image from 'primevue/image';
import { PrimeIcons } from 'primevue/api';

const sections = [
  {
    image: 'screenshot-add-progress',
    heading: 'Track your work your way',
    body: [
      `TrackBear can help no matter how or what you write. You can record progress in <b>words, chapters, pages,
      scenes, lines, or time</b>. You can even mix-and-match how you track within a single project. Finished writing
      your first draft and need to switch from words written to time spent editing? TrackBear can handle that, no problem.`,
    ],
  },
  {
    image: 'screenshot-target',
    heading: 'Stay on target',
    body: [
      `Aiming to write a novel in a month? Trying to finish your fanfic over summer break? Want to set a sustainable
      pace for a quarter-million words this year? TrackBear has you covered with <b>targets</b>. Set a goal and a date
      range, and TrackBear will graph your progress and show you where you are versus par for the day. Targets can span
      multiple projects, so you can see progress across all your work.`,
      `(P.S.: you can even import your old projects from NaNoWriMo.)`,
    ],
  },
  {
    image: 'screenshot-habit',
    heading: 'Build writing habits',
    body: [
      `TrackBear can help you track writing habits too. If you're trying to draw a comic page a day, spend two hours a
      day editing, or just write <i>something</i>, set a <b>habit</b> and TrackBear will show you how you're doing. And
      there's no judgement for breaking a streak — TrackBear celebrates with you but doesn't shame you if you miss a day.`,
    ],
  },
  {
    image: 'screenshot-board',
    heading: 'Words with friends',
    body: [
      `Keep up with your community with leaderboards. When you create a leaderboard and your friends join it, everyone
      can see each other's progress. You can cheer your friends on, set up an accountability buddy system, or all try
      to hit a community goal together. Writing is more fun with friends, and TrackBear helps make that happen.`,
    ],
  },
  {
    image: 'screenshot-dashboard',
    heading: 'No funny business',
    body: [
      `TrackBear is designed with privacy in mind and will <b>always be free to use</b>. TrackBear isn't a social
      network, a chat platform, or AI-powered, and there is no premium tier or pay-to-play. There are no ads, no
      third-party tracking, and no data harvesting. It's just a place for you to track your writing.`,
    ],
  },
];

const imagePt = {
  rotateRightButton: { class: ['hidden'] },
  rotateLeftButton: { class: ['hidden'] },
  zoomInButton: { class: ['hidden'] },
  zoomOutButton: { class: ['hidden'] },
  preview: { class: ['p-8 max-h-screen max-w-screen'] },
};
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
          TrackBear is an app that helps you track your writing projects. You can track words, chapters, pages, and
          time. That makes it a perfect fit no matter whether you're writing a novel, fanfiction, poetry, a webcomic,
          or anything else! You can also set writing targets, track your writing habits, and set up leaderboards to
          include your friends. No matter what, TrackBear is here to support you, however you write.
        </p>
        <p>
          <RouterLink
            class="underline text-primary-500 dark:text-primary-400"
            :to="{ name: 'signup' }"
          >
            Sign up to start tracking your writing!
          </RouterLink>
        </p>
      </TextBlurb>
      <div
        v-for="(section, ix) of sections"
        :key="ix"
        :class="[
          'flex flex-row flex-wrap md:flex-nowrap gap-4 max-w-screen-lg mx-auto p-4',
          { 'flex-row-reverse': ix % 2 !== 0 },
        ]"
      >
        <div class="w-full md:w-1/3">
          <Image
            :src="`images/${section.image}-${theme}-${size}.png`"
            alt=""
            preview
            :pt="imagePt"
          >
            <template #indicatoricon>
              <span :class="PrimeIcons.SEARCH" />
            </template>
          </Image>
        </div>
        <div class="w-full md:w-2/3">
          <h2 class="font-heading text-2xl font-bold mb-2">
            {{ section.heading }}
          </h2>
          <!-- eslint-disable vue/no-v-html -->
          <p
            v-for="(p, pix) of section.body"
            :key="pix"
            class="mb-2"
            v-html="p"
          />
          <!-- eslint-enable vue/no-v-html -->
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
