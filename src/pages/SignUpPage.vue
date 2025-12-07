<script setup lang="ts">
import Card from 'primevue/card';
import PorchLayout from 'src/layouts/PorchLayout.vue';
import SignUpForm from 'src/components/login/SignUpForm.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';

</script>

<template>
  <PorchLayout>
    <div class="flex h-full justify-center items-center">
      <Card
        class="flex-auto m-2 md:max-w-2xl"
      >
        <template #title>
          <SectionTitle title="Sign Up" />
        </template>
        <template #content>
          <SignUpForm />
        </template>
      </Card>
    </div>
  </PorchLayout>
</template>

<style scoped>
</style>
