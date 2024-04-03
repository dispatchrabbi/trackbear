<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { format, parseISO } from 'date-fns';

import { getBanners, Banner } from 'src/lib/api/admin/banner.ts';

import AdminLayout from 'src/layouts/AdminLayout.vue';
import type { MenuItem } from 'primevue/menuitem';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputSwitch from 'primevue/inputswitch';
import AnnouncementBanner from 'src/components/banner/AnnouncementBanner.vue';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import CreateBannerForm from 'src/components/banner/CreateBannerForm.vue';
import EditBannerForm from 'src/components/banner/EditBannerForm.vue';
import DeleteBannerForm from 'src/components/banner/DeleteBannerForm.vue';
import { PrimeIcons } from 'primevue/api';

const breadcrumbs: MenuItem[] = [
  { label: 'Admin', url: '/admin' },
  { label: 'Banners', url: '/admin/banners' },
];

const isCreateFormVisible = ref<boolean>(false);

const banners = ref<Banner[]>([]);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const loadBanners = async function() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    banners.value = await getBanners();
  } catch(err) {
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

const onlyShowEnabledBanners = ref<boolean>(true);
const onlyShowCurrentBanners = ref<boolean>(true);

const sortedFilteredBanners = computed(() => {
  let sortedBanners = banners.value.toSorted((a, b) =>
    a.showUntil > b.showUntil ? -1 : a.showUntil < b.showUntil ? 1 :
      a.updatedAt > b.updatedAt ? -1 : a.updatedAt < b.updatedAt ? 1 :
    0
  );

  if(onlyShowEnabledBanners.value) {
    sortedBanners = sortedBanners.filter(b => isBannerEnabled(b));
  }

  if(onlyShowCurrentBanners.value) {
    sortedBanners = sortedBanners.filter(b => isBannerCurrent(b));
  }

  return sortedBanners;
});

function isBannerCurrent(banner: Banner): boolean {
  const now = (new Date()).toISOString();
  return (banner.showUntil > now);
}

function isBannerEnabled(banner: Banner): boolean {
  return banner.enabled;
}

function isBannerActive(banner: Banner): boolean {
  return isBannerEnabled(banner) && isBannerCurrent(banner);
}

const currentlyEditingBanner = ref<Banner>(null);
const isEditFormVisible = computed({
  get: () => currentlyEditingBanner.value !== null,
  set: () => currentlyEditingBanner.value = null, // nothing sensible to set it to unless it's null
});

const currentlyDeletingBanner = ref<Banner>(null);
const isDeleteFormVisible = computed({
  get: () => currentlyDeletingBanner.value !== null,
  set: () => currentlyDeletingBanner.value = null, // nothing sensible to set it to unless it's null
});

onMounted(() => loadBanners());

</script>

<template>
  <AdminLayout
    :breadcrumbs="breadcrumbs"
  >
    <div class="actions flex justify-end gap-4 mb-4">
      <div class="flex gap-1 items-center">
        <span :class="PrimeIcons.HISTORY" />
        <InputSwitch
          v-model="onlyShowCurrentBanners"
        />
        <span :class="PrimeIcons.ARROW_CIRCLE_UP" />
      </div>
      <div class="flex gap-1 items-center">
        <span :class="PrimeIcons.TIMES_CIRCLE" />
        <InputSwitch
          v-model="onlyShowEnabledBanners"
        />
        <span :class="PrimeIcons.CHECK_CIRCLE" />
      </div>
      <div>
        <Button
          label="New"
          :icon="PrimeIcons.PLUS"
          @click="isCreateFormVisible = true"
        />
      </div>
    </div>
    <div
      class="banner-list"
    >
      <Card
        v-for="banner in sortedFilteredBanners"
        :key="banner.id"
        class="my-4"
      >
        <template #content>
          <AnnouncementBanner
            :message="banner.message"
            :color="banner.color"
            :icon="banner.icon"
          />
        </template>
        <template #footer>
          <div class="flex items-center gap-2">
            <span
              :class="isBannerActive(banner) ? PrimeIcons.EYE : PrimeIcons.EYE_SLASH"
            />
            <Tag
              :severity="isBannerEnabled(banner) ? 'success' : 'danger'"
              :value="isBannerEnabled(banner) ? 'enabled' : 'disabled'"
            />
            <Tag
              :severity="isBannerCurrent(banner) ? 'success' : 'warning'"
              :value="isBannerCurrent(banner) ? 'showing until' : 'expired at'"
            />
            <div class="font-light">
              {{ format(parseISO(banner.showUntil), 'E MMM d, yyy @ HH:mm:ss (XX)') }}
            </div>
            <div class="spacer grow" />
            <Button
              :icon="PrimeIcons.PENCIL"
              text
              @click="currentlyEditingBanner = banner"
            />
            <Button
              :icon="PrimeIcons.TRASH"
              severity="danger"
              text
              @click="currentlyDeletingBanner = banner"
            />
          </div>
        </template>
      </Card>
    </div>
    <div v-if="banners.length > 0 && sortedFilteredBanners.length === 0">
      No banners to list. Maybe you need to toggle the switches?
    </div>
    <div v-if="banners.length === 0">
      You haven't made any banners yet. Click the <span class="font-bold">New Banner</span> button to get started!
    </div>
    <Dialog
      v-model:visible="isCreateFormVisible"
      maximizable
      modal
    >
      <template #header>
        <h2 class="font-heading font-semibold uppercase">
          <span :class="PrimeIcons.PLUS" />
          Create Banner
        </h2>
      </template>
      <CreateBannerForm
        @banner:create="loadBanners()"
        @form-success="isCreateFormVisible = false"
      />
    </Dialog>
    <Dialog
      v-model:visible="isEditFormVisible"
      maximizable
      modal
    >
      <template #header>
        <h2 class="font-heading font-semibold uppercase">
          <span :class="PrimeIcons.PLUS" />
          Edit Banner
        </h2>
      </template>
      <EditBannerForm
        :banner="currentlyEditingBanner"
        @banner:edit="loadBanners()"
        @form-success="isEditFormVisible = false"
      />
    </Dialog>
    <Dialog
      v-model:visible="isDeleteFormVisible"
      maximizable
      modal
    >
      <template #header>
        <h2 class="font-heading font-semibold uppercase">
          <span :class="PrimeIcons.PLUS" />
          Delete Banner
        </h2>
      </template>
      <DeleteBannerForm
        :banner="currentlyDeletingBanner"
        @banner:delete="loadBanners()"
        @form-success="isDeleteFormVisible = false"
      />
    </Dialog>
  </AdminLayout>
</template>

<style scoped>
</style>
