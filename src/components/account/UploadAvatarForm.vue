<script setup lang="ts">
import { ref } from 'vue';

import { uploadAvatar } from 'src/lib/api/me.ts';
import { ALLOWED_AVATAR_FORMATS, MAX_AVATAR_SIZE_IN_BYTES } from 'server/lib/models/user/consts';

import FileUpload, { type FileUploadUploaderEvent } from 'primevue/fileupload';

const emit = defineEmits(['user:avatar', 'formSuccess']);

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleUpload(ev: FileUploadUploaderEvent) {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const avatar: File = ev.files[0];

    const formData = new FormData();
    formData.append('avatar', avatar);

    await uploadAvatar(formData);
    emit('user:avatar');

    successMessage.value = `Your new avatar has been uploaded.`;
    emit('formSuccess');
  } catch (err) {
    errorMessage.value = `Could not upload your avatar: ${err.message}.`;
    return;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <FileUpload
    name="avatar"
    mode="advanced"
    :custom-upload="true"
    :multiple="false"
    :file-limit="1"
    :accept="Object.keys(ALLOWED_AVATAR_FORMATS).join(',')"
    :max-file-size="MAX_AVATAR_SIZE_IN_BYTES"
    :pt="{
      thumbnail: { class: ['rounded-full', 'aspect-square', 'object-cover'] },
      details: { class: ['flex-grow'] },
    }"
    :pt-options="{ mergeSections: true, mergeProps: true }"
    @uploader="handleUpload"
  >
    <template #empty>
      <div>Drag and drop your new avatar here, or click <span class="font-semibold">Choose</span> to open a file picker.</div>
      <div>Accepted formats include {{ Object.values(ALLOWED_AVATAR_FORMATS).map(ext => ext.toUpperCase()).join(', ') }}. Maximum file size is 2MB.</div>
    </template>
  </FileUpload>
</template>

<style scoped>
</style>
