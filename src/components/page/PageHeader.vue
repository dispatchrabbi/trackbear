<script setup lang="ts">
</script>

<template>
<VaNavbar>
  <template #left>
    <VaNavbarItem class="logo text-xl">🐻 TrackBear</VaNavbarItem>
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
        <VaButton
          icon="account_circle"
          preset="secondary"
          border-color="primary"
        >Account</VaButton>
      </RouterLink>
      </VaNavbarItem>
  </template>
</VaNavbar>
</template>

<style scoped>
</style>
