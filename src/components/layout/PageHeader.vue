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
            <div>TrackBear <sup class="text-sm">alpha</sup></div>
          </div>
        </RouterLink>
      </VaNavbarItem>
    </template>
    <template #right>
      <VaNavbarItem>
        <DarkModeToggle />
      </VaNavbarItem>
      <template v-if="userStore.user">
        <VaNavbarItem class="mobile">
          <VaMenu>
            <template #anchor>
              <VaButton icon="menu" />
            </template>
            <VaMenuList>
              <VaMenuItem>
                <RouterLink to="/projects">
                  Projects
                </RouterLink>
              </VaMenuItem>
              <VaMenuItem>
                <RouterLink to="/leaderboards">
                  Leaderboards
                </RouterLink>
              </VaMenuItem>
              <VaDivider />
              <VaMenuItem>
                <RouterLink to="/logout">
                  Log Out
                </RouterLink>
              </VaMenuItem>
            </VaMenuList>
          </VaMenu>
        </VaNavbarItem>
        <VaNavbarItem class="desktop">
          <RouterLink to="/projects">
            <VaButton preset="secondary">
              Projects
            </VaButton>
          </RouterLink>
        </VaNavbarItem>
        <VaNavbarItem class="desktop">
          <RouterLink to="/leaderboards">
            <VaButton preset="secondary">
              Leaderboards
            </VaButton>
          </RouterLink>
        </VaNavbarItem>
        <!-- <VaNavbarItem class="desktop">
          <VaNavbarItem class="desktop">
            <RouterLink to="/account">
              <VaButton preset="secondary">
                Account
              </VaButton>
            </RouterLink>
          </VaNavbarItem>
        </VaNavbarItem> -->
        <VaNavbarItem class="desktop">
          <VaNavbarItem class="desktop">
            <RouterLink to="/logout">
              <VaButton preset="secondary">
                Log Out
              </VaButton>
            </RouterLink>
          </VaNavbarItem>
        </VaNavbarItem>
      </template>
      <template v-else>
        <VaNavbarItem class="mobile">
          <VaMenu>
            <template #anchor>
              <VaButton icon="menu" />
            </template>
            <VaMenuList>
              <VaMenuItem>
                <RouterLink to="/signup">
                  Sign Up
                </RouterLink>
              </VaMenuItem>
              <VaMenuItem>
                <RouterLink to="/login">
                  Log In
                </RouterLink>
              </VaMenuItem>
            </VaMenuList>
          </VaMenu>
        </VaNavbarItem>
        <VaNavbarItem class="desktop">
          <VaButton
            preset="secondary"
            @click="router.push('/signup')"
          >
            Sign Up!
          </VaButton>
        </VaNavbarItem>
        <VaNavbarItem class="desktop">
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
  color: var(--va-danger);
}

.desktop {
  @apply hidden;
  @apply sm:block;
}

.mobile {
  @apply block;
  @apply sm:hidden;
  @apply mr-0;
}
</style>
