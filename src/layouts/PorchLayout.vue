<script setup lang="ts">
import BannerContainer from 'src/components/banner/BannerContainer.vue';
import PorchHeader from 'src/components/layout/PorchHeader.vue';
import PorchFooter from 'src/components/layout/PorchFooter.vue';
</script>

<template>
  <BannerContainer />
  <div class="porch">
    <div class="bar">
      <PorchHeader />
    </div>
    <div class="main bg-surface-50 dark:bg-surface-900">
      <slot />
    </div>
    <div class="foot">
      <PorchFooter />
    </div>
  </div>
</template>

<style scoped>
.porch {
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
