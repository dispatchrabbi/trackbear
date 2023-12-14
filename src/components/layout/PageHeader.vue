<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

import { useUserStore } from '../../stores/user.ts';
const userStore = useUserStore();

</script>

<template>
  <VaNavbar>
    <template #left>
      <VaNavbarItem class="logo text-xl">
        🐻 BearTracks
      </VaNavbarItem>
    </template>
    <template #right>
      <template v-if="userStore.user">
        <VaNavbarItem>
          <VaButton
            preset="secondary"
            @click="router.push('/projects')"
          >
            Projects
          </VaButton>
        </VaNavbarItem>
        <VaNavbarItem>
          <VaButton
            preset="secondary"
            @click="router.push('/account')"
          >
            Account
          </VaButton>
        </VaNavbarItem>
        <VaNavbarItem>
          <VaButton
            preset="secondary"
            @click="router.push('/logout')"
          >
            Log Out
          </VaButton>
        </VaNavbarItem>
      </template>
      <template v-else>
        <VaNavbarItem>
          <VaButton
            preset="secondary"
            @click="router.push('/sign-up')"
          >
            Sign Up!
          </VaButton>
        </VaNavbarItem>
        <VaNavbarItem>
          <VaButton
            @click="router.push('/login')"
          >
            Log In
          </VaButton>
        </VaNavbarItem>
      </template>
    </template>
  </VaNavbar>
</template>

<style scoped>
</style>
