<script setup lang="ts">
import Card from 'primevue/card';
import PorchLayout from 'src/layouts/PorchLayout.vue';
import SignUpForm from 'src/components/login/SignUpForm.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';

// import { ref, reactive } from 'vue';

// import { z } from 'zod';
// import { useValidation } from 'src/lib/form.ts';

// import { useRouter } from 'vue-router';
// const router = useRouter();

// import AppPage from 'src/components/layout/AppPage.vue';
// import ContentHeader from 'src/components/layout/ContentHeader.vue';
// import TogglablePasswordInput from 'src/components/form/TogglablePasswordInput.vue'
// import { signUp } from 'src/lib/api/auth.ts';
// import { CreateUserPayload } from 'server/api/auth.ts';

// const formModel = reactive({
//   username: '',
//   email: '',
//   password: '',
// });

// const validations = z.object({
//   username: z
//     .string()
//     .min(3, { message: 'Username must be at least 3 characters long.' })
//     .regex(/^[a-z][a-z0-9_-]+$/i, { message: 'Username must start with a letter and only use letters, numbers, underscores, and dashes.' }),
//   email: z.string().email({ message: 'Please enter a valid email address.' }),
//   password: z.string().min(8, { message: 'Password must be at least 8 characters long.'}),
// });

// const { formData, validate, isValid, ruleFor } = useValidation(validations, formModel);

// const isLoading = ref<boolean>(false);
// const successMessage = ref<string>('');
// const errorMessage = ref<string>('');

// async function handleSubmit() {
//   successMessage.value = '';
//   errorMessage.value = '';
//   isLoading.value = true;

//   try {
//     await signUp(formData() as CreateUserPayload);
//     successMessage.value = 'Sign up successful! Redirecting to login...';
//     setTimeout(() => router.push('/login'), 3 * 1000);
//   } catch(err) {
//     if(err.code === 'VALIDATION_FAILED') {
//       errorMessage.value = err.message;
//     } else if(err.code === 'USERNAME_EXISTS') {
//       errorMessage.value = 'That username is already taken. Please choose another.';
//     } else {
//       errorMessage.value = 'Could not sign up; something went wrong server-side.';
//     }
//   }

//   isLoading.value = false;
// }

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
