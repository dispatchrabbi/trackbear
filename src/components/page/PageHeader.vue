<script setup lang="ts">
</script>

<template>
<VaNavbar>
  <template #left>
    <VaNavbarItem class="logo text-xl">🐻 BearTracks</VaNavbarItem>
  </template>
  <template #right>
    <VaNavbarItem>
      <RouterLink to="/projects">
        <VaButton
          preset="secondary"
        >Projects</VaButton>
      </RouterLink>
    </VaNavbarItem>
    <VaNavbarItem>
      <RouterLink to="/account">
        <VaAvatar class="mr-4">U</VaAvatar>
      </RouterLink>
      </VaNavbarItem>
  </template>
</VaNavbar>
</template>

<style scoped>
</style>
