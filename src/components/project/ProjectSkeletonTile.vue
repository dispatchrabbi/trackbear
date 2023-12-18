<script setup lang="ts">
import { VaSkeleton, VaSkeletonGroup } from 'vuestic-ui';

</script>

<template>
  <VaSkeletonGroup animation="wave">
    <VaCard>
      <VaCardTitle>
        <VaSkeleton
          variant="text"
          class="va-h3"
        />
      </VaCardTitle>
      <VaCardContent>
        <VaSkeleton height="12rem" />
      </VaCardContent>
    </VaCard>
  </VaSkeletonGroup>
</template>

<style scoped>

</style>
