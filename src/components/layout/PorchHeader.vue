<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

import Menubar from 'primevue/menubar';
import Button from 'primevue/button';

// TODO: restore the dark mode toggle
// import DarkModeToggle from './DarkModeToggle.vue';

</script>

<template>
  <Menubar>
    <template #start>
      <div class="masthead flex gap-1 text-2xl font-heading">
        <div class="logo flex-none">
          <img :src="`/images/brown-bear.png`">
        </div>
        <div class="app-name">
          <span class="uppercase">TrackBear</span><span class="disclaimer text-sm text-red-500">alpha</span>
        </div>
      </div>
    </template>
    <template #end>
      <Button label="Log in!" />
    </template>
  </Menubar>
  <!-- <VaNavbar>
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
                <RouterLink to="/account">
                  Account
                </RouterLink>
              </VaMenuItem>
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
        <VaNavbarItem class="desktop">
          <VaMenu>
            <template #anchor>
              <VaAvatar>{{ userStore.user.displayName.substring(0, 1).toUpperCase() }}</VaAvatar>
            </template>
            <VaMenuItem>
              <RouterLink to="/account">
                Account
              </RouterLink>
            </VaMenuItem>
            <VaMenuItem>
              <RouterLink to="/logout">
                Log Out
              </RouterLink>
            </VaMenuItem>
          </VaMenu>
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
  </VaNavbar> -->
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

:deep(.va-navbar__right) {
  align-items: center;
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
