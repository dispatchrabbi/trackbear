<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

import BannerContainer from 'src/components/banner/BannerContainer.vue';
import PorchHeader from 'src/components/layout/PorchHeader.vue';
</script>

<template>
  <BannerContainer />
  <div class="porch">
    <div class="bar">
      <PorchHeader />
    </div>
    <div class="main">
      <slot />
    </div>
    <div class="foot">

    </div>
  </div>
</template>

<style scoped>
.application {
  display: grid;
  grid-template:
    "bar"
    "main" 1fr
    "foot"
    / 1fr
  ;

  min-height: 100vh;

}

.bar {
  grid-area: bar;
}

.main {
  grid-area: main;
}

.foot {
  grid-area: foot;
}

</style>
