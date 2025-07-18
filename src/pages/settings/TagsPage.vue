<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useTagStore } from 'src/stores/tag.ts';
const tagStore = useTagStore();

import { type Tag } from 'src/lib/api/tag.ts';

import SettingsLayout from 'src/layouts/SettingsLayout.vue';
import SectionTitle from 'src/components/layout/SectionTitle.vue';
import CreateTagForm from 'src/components/tag/CreateTagForm.vue';
import EditTagForm from 'src/components/tag/EditTagForm.vue';
import DeleteTagForm from 'src/components/tag/DeleteTagForm.vue';
import TbTag from 'src/components/tag/TbTag.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

import type { MenuItem } from 'primevue/menuitem';
import { PrimeIcons } from 'primevue/api';

const breadcrumbs: MenuItem[] = [
  { label: 'Account' },
  { label: 'Tags', url: '/account/tags' },
];

const errorMessage = ref<string | null>(null);
async function loadTags() {
  try {
    await tagStore.populate();
  } catch {
    errorMessage.value = 'Could not get tags; something went wrong server-side.';
  }
}

const isCreateFormVisible = ref<boolean>(false);

const currentlyEditingTag = ref<Tag>(null);
const isEditFormVisible = computed({
  get: () => currentlyEditingTag.value !== null,
  set: () => currentlyEditingTag.value = null, // nothing sensible to set it to unless it's null
});

const currentlyDeletingTag = ref<Tag>(null);
const isDeleteFormVisible = computed({
  get: () => currentlyDeletingTag.value !== null,
  set: () => currentlyDeletingTag.value = null, // nothing sensible to set it to unless it's null
});

onMounted(async () => {
  await loadTags();
});

</script>

<template>
  <SettingsLayout
    :breadcrumbs="breadcrumbs"
  >
    <div
      v-if="errorMessage"
    >
      {{ errorMessage }}
    </div>
    <div
      v-if="tagStore.tags"
      class="flex flex-col justify-center"
    >
      <SectionTitle
        title="Tags"
      />
      <DataTable
        :value="tagStore.allTags"
        data-key="id"
      >
        <Column
          field="name"
          header="Name"
        >
          <template #body="{ data }">
            <TbTag :tag="data" />
          </template>
        </Column>
        <Column
          header=""
          class="w-0 text-center"
        >
          <template #header>
            <Button
              label="New"
              size="small"
              :icon="PrimeIcons.PLUS"
              @click="isCreateFormVisible = true"
            />
          </template>
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                :icon="PrimeIcons.PENCIL"
                severity="secondary"
                text
                rounded
                @click="currentlyEditingTag = data"
              />
              <Button
                :icon="PrimeIcons.TRASH"
                severity="danger"
                text
                rounded
                @click="currentlyDeletingTag = data"
              />
            </div>
          </template>
        </Column>
      </DataTable>
      <Dialog
        v-model:visible="isCreateFormVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.PLUS" />
            Create Tag
          </h2>
        </template>
        <CreateTagForm
          @tag:create="loadTags()"
          @form-success="isCreateFormVisible = false"
        />
      </Dialog>
      <Dialog
        v-model:visible="isEditFormVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.PENCIL" />
            Edit Tag
          </h2>
        </template>
        <EditTagForm
          :tag="currentlyEditingTag"
          @tag:edit="loadTags()"
          @form-success="currentlyEditingTag = null"
        />
      </Dialog>
      <Dialog
        v-model:visible="isDeleteFormVisible"
        modal
      >
        <template #header>
          <h2 class="font-heading font-semibold uppercase">
            <span :class="PrimeIcons.TRASH" />
            Delete Tag
          </h2>
        </template>
        <DeleteTagForm
          :tag="currentlyDeletingTag"
          @tag:delete="loadTags()"
          @form-success="currentlyDeletingTag = null"
        />
      </Dialog>
    </div>
  </SettingsLayout>
</template>

<style scoped>
</style>
