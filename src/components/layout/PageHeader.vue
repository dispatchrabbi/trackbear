<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

import { useColors } from 'vuestic-ui';
const { currentPresetName } = useColors();

import { useUserStore } from '../../stores/user.ts';
const userStore = useUserStore();

import DarkModeToggle from './DarkModeToggle.vue';

</script>

<template>
  <VaNavbar>
    <template #left>
      <VaNavbarItem class="logo text-xl">
        <RouterLink
          :to="userStore.user ? '/projects' : '/'"
        >
          <div class="flex items-center gap-1 text-2xl masthead">
            <div class="logo">
              <img :src="`/images/${ currentPresetName === 'dark' ? 'polar-bear' : 'brown-bear' }.png`">
            </div>
            <div>TrackBear <sup class="text-sm">Alpha</sup></div>
          </div>
        </RouterLink>
      </VaNavbarItem>
    </template>
    <template #right>
      <VaNavbarItem>
        <DarkModeToggle />
      </VaNavbarItem>
      <template v-if="userStore.user">
        <VaNavbarItem>
          <VaButton
            preset="secondary"
            @click="router.push('/projects')"
          >
            Projects
          </VaButton>
        </VaNavbarItem>
        <!-- <VaNavbarItem>
          <VaButton
            preset="secondary"
            @click="router.push('/account')"
          >
            Account
          </VaButton>
        </VaNavbarItem> -->
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
            @click="router.push('/signup')"
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
.masthead > .logo {
  flex: none;
}
.logo > img {
  height: 1em;
  aspect-ratio: 1;
}

.masthead sup {
  color: var(--va-warning);
}
</style>
