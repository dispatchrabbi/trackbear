<script setup lang="ts">
</script>

<template>
  <footer
    class="pt-12 pb-6"
  >
    <div class="links flex justify-start items-baseline gap-2 container mx-auto max-w-screen-md px-6 text-sm">
      <div class="font-black text-2xl">
        TRACKBEAR
      </div>
      <div>
        is made with 🐻 by <a
          href="https://github.com/dispatchrabbi"
          target="_blank"
        >@dispatchrabbi</a>.
      </div>
    </div>
    <div class="links flex justify-start items-baseline gap-2 container mx-auto max-w-screen-md px-6 text-sm">
      <div>
        <RouterLink to="/">
          Home
        </RouterLink>
      </div>
      <div>/</div>
      <div>
        <RouterLink to="/about">
          About
        </RouterLink>
      </div>
      <div>/</div>
      <div>
        <RouterLink to="/privacy">
          Privacy
        </RouterLink>
      </div>
      <!-- <div>/</div>
      <div>
        <RouterLink to="/ko-fi">
          Buy me a coffee
        </RouterLink>
      </div> -->
    </div>
  </footer>
</template>

<style scoped>
footer {
  background-color: var(--va-background-secondary);
}

.links > div {
  flex: 0 1 auto;
}
</style>
