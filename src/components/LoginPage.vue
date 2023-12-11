<script setup lang="ts">

import Page from './page/Page.vue';

</script>

<template>
<Page>
  <h2 class="va-h2 mb-3">Log In</h2>
  <VaCard>
    <VaCardContent>
      <VaForm class="flex flex-col gap-4">
        <VaInput
          label="Username"
        ></VaInput>
        <VaInput
          type="password"
          label="Password"
        ></VaInput>
        <div class="flex gap-4 mt-4">
          <VaButton>Log In</VaButton>
        </div>
      </VaForm>
    </VaCardContent>
  </VaCard>
</Page>
</template>

<style scoped>
</style>
