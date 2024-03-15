<script setup lang="ts">
import Card from 'primevue/card';
import PorchLayout from 'src/layouts/PorchLayout.vue';
import ResetPasswordForm from 'src/components/login/ResetPasswordForm.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
</script>

<template>
  <PorchLayout>
    <div class="flex h-full justify-center items-center">
      <Card
        class="flex-auto m-2 md:max-w-2xl"
      >
        <template #title>
          <SectionTitle title="Reset Password" />
        </template>
        <template #content>
          <ResetPasswordForm />
        </template>
      </Card>
    </div>
  </PorchLayout>
</template>

<style scoped>
</style>
