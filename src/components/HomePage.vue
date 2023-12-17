<script setup lang="ts">
import AppPage from './layout/AppPage.vue';
</script>

<template>
  <AppPage>
    <VaCard>
      <VaImage
        src="images/hans-jurgen-mager-qQWV91TTBrE-992.jpg"
        class="hp-card-image object-cover max-h-96"
        title="Photo by Hans-Jurgen Mager on Unsplash"
        alt="A picture of a polar bear standing on its hind legs with a paw raised as if in greeting"
      />
      <VaCardTitle>Welcome to TrackBear!</VaCardTitle>
      <VaCardContent>
        <p>
          Thank you for being part of the alpha test! Even though it could get a bit grizzly, I'm de-panda-ing on your feedback to help me get this writing tracker to a high koala-ty state.
        </p>
        <p class="mt-3">
          Start by signing up for an account by clicking <b>Sign Up</b> in the upper right-hand corner.
        </p>
        <p class="mt-3">
          <b class="danger">IMPORTANT NOTE!</b> This is untested software and, while I will do my best to keep everything intact, I cannot guarantee that your data will not get lost. If you can't bear to lose your progress, track it somewhere else as well.
        </p>
      </VaCardContent>
    </VaCard>
  </AppPage>
</template>

<style scoped>
.hp-card-image {

}
.danger {
  color: var(--va-danger);
}
</style>
