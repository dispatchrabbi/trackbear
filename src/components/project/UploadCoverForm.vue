<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { useEventBus } from '@vueuse/core';

import { uploadCover, type Project } from 'src/lib/api/project';
import { ALLOWED_COVER_FORMATS, MAX_COVER_SIZE_IN_BYTES } from 'server/lib/models/project/consts';

import FileUpload, { FileUploadUploaderEvent } from 'primevue/fileupload';

const props = defineProps<{
  project: Project;
}>();

const emit = defineEmits(['project:cover', 'formSuccess']);
const eventBus = useEventBus<{ project: Project }>('project:cover');

const isLoading = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

async function handleUpload(ev: FileUploadUploaderEvent) {
  isLoading.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const cover: File = ev.files[0];

    const formData = new FormData();
    formData.append('cover', cover);

    const updatedProject = await uploadCover(props.project.id, formData);
    emit('project:cover', { id: props.project.id });
    eventBus.emit({ project: updatedProject });

    successMessage.value = `Your new cover has been uploaded.`;
    emit('formSuccess');
  } catch (err) {
    errorMessage.value = `Could not upload your cover: ${err.message}.`;
    return;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <FileUpload
    name="cover"
    mode="advanced"
    :custom-upload="true"
    :multiple="false"
    :file-limit="1"
    :accept="Object.keys(ALLOWED_COVER_FORMATS).join(',')"
    :max-file-size="MAX_COVER_SIZE_IN_BYTES"
    :pt="{
      thumbnail: { class: ['h-48 w-32', 'aspect-2/3', 'object-contain', 'mr-2'] },
      details: { class: ['flex-grow'] },
    }"
    :pt-options="{ mergeSections: true, mergeProps: true }"
    @uploader="handleUpload"
  >
    <template #empty>
      <div>Drag and drop your new cover here, or click <span class="font-semibold">Choose</span> to open a file picker.</div>
      <div>Accepted formats include {{ Object.values(ALLOWED_COVER_FORMATS).map(ext => ext.toUpperCase()).join(', ') }}. Maximum file size is 2MB; for best results, upload a file with a 2:3 aspect ratio (like 320x480px).</div>
    </template>
  </FileUpload>
</template>

<style scoped>
</style>
