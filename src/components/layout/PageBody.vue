<template>
  <div
    id="page-body"
    class="pb-8"
  >
    <div class="container mx-auto max-w-screen-md p-4">
      <slot />
    </div>
  </div>
</template>

<style scoped>
#page-body {
  background-color: var(--va-background-primary);
}
</style>
