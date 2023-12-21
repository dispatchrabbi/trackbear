<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useColors } from "vuestic-ui";

const { applyPreset, currentPresetName } = useColors();

const themeName = computed({
  get() { return currentPresetName.value; },
  set(value) {
    applyPreset(value);
    localStorage.setItem('theme', value);
  }
});

const toggleIcons = {
  light: 'light_mode',
  dark: 'dark_mode',
};

onMounted(() => {
  const theme = localStorage.getItem('theme') || 'light';
  themeName.value = theme;
});

</script>

<template>
  <VaSwitch
    v-model="themeName"
    true-value="dark"
    false-value="light"
    color="#5123a1"
    off-color="#ffd300"
    style="--va-switch-checker-background-color: #252723;"
  >
    <template #innerLabel>
      <div class="va-text-center">
        <VaIcon
          :name="toggleIcons[themeName]"
        />
      </div>
    </template>
  </VaSwitch>
</template>
