<script setup lang="ts">
// import { ref, reactive } from 'vue';

// import { z } from 'zod';
// import { useValidation } from 'src/lib/form.ts';

// import { useRouter } from 'vue-router';
// const router = useRouter();

// import { useUserStore } from '../stores/user.ts';
// const userStore = useUserStore();

import Card from 'primevue/card';
import PorchLayout from 'src/layouts/PorchLayout.vue';
import LoginForm from 'src/components/login/LoginForm.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';

// const formModel = reactive({
//   username: '',
//   password: '',
// });

// const validations = z.object({
//   username: z.string().min(1, { message: 'Please enter your username.' }),
//   password: z.string().min(1, { message: 'Please enter your password.' }),
// });

// const { formData, validate, isValid, ruleFor } = useValidation(validations, formModel);

// const isLoading = ref<boolean>(false);
// const errorMessage = ref<string>('');

// async function handleSubmit() {
//   errorMessage.value = '';
//   isLoading.value = true;

//   try {
//     const { username, password } = formData();
//     await userStore.logIn(username, password);
//   } catch(err) {
//     if(err.code === 'INCORRECT_CREDS') {
//       errorMessage.value = 'Incorrect username or password. Please check and try again.';
//     } else {
//       errorMessage.value = err;
//     }
//     return;
//   } finally {
//     isLoading.value = false;
//   }

//   router.push('/projects');
// }

</script>

<template>
  <PorchLayout>
    <div class="flex h-full justify-center items-center">
      <Card
        class="flex-auto m-2 md:max-w-2xl"
      >
        <template #title>
          <SectionTitle title="Log In" />
        </template>
        <template #content>
          <LoginForm />
        </template>
      </Card>
    </div>
  </PorchLayout>
</template>

<style scoped>
</style>
