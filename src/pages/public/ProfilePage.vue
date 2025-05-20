<script setup lang="ts">
import { ref, onMounted } from 'vue';

import { useRoute } from 'vue-router';
const route = useRoute();

import { getProfile } from 'src/lib/api/profile.ts';

import PorchLayout from 'src/layouts/PorchLayout.vue';
import PublicProfile from 'src/components/profile/PublicProfile.vue';
import TextBlurb from 'src/components/layout/TextBlurb.vue';

const profile = ref(null);
const profilePopulated = ref(false);
const populateProfile = async function() {
  const username = (route.params.username as string).replace('@', '');

  try {
    const result = await getProfile(username);
    profile.value = result;
  } catch {
    profile.value = null;
  } finally {
    profilePopulated.value = true;
  }
};

onMounted(() => {
  populateProfile();
});

</script>

<template>
  <PorchLayout>
    <div class="p-4 max-w-screen-lg mx-auto mt-4">
      <div
        v-if="profilePopulated && profile !== null"
      >
        <PublicProfile
          :profile="profile"
        />
      </div>
      <div
        v-else-if="profilePopulated && profile === null"
      >
        <TextBlurb title="404">
          <p>Not sure why you're here. Maybe you're meant to be somewhere else?</p>
        </TextBlurb>
      </div>
    </div>
  </PorchLayout>
</template>

<style scoped>
</style>
