<script setup lang="ts">
</script>

<template>
  <main>
    <h1>Please bear with us!</h1>
    <!-- eslint-disable-next-line vue/html-self-closing -->
    <img
      class="hero"
      src="/public/images/hans-jurgen-mager_p2xEnIZAv1E_polar-bear-sleeping_992.jpg"
      alt="A picture of a polar bear sleeping in the snow"
      title="Photo by Hans-Jurgen Mager on Unsplash"
    >
    <p>TrackBear is offline for maintenance. We'll be back online soon!</p>
  </main>
</template>

<style scoped>
:root {
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 16px;
}

main {
  max-width: 62rem;
  margin: auto;
}

h1 {
  text-align: center;
  font-size: 2rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

img.hero {
  width: 100%;
  max-height: 24rem;
  object-fit: cover;
}

p {
  text-align: center;
  padding-top: 1rem;
  padding-bottom: 1rem;
}
</style>
