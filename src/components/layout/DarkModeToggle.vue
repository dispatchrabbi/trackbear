<script setup lang="ts">
import { ref, watch } from 'vue';
import { useColors } from "vuestic-ui";

const { applyPreset } = useColors();

const themeName = ref(localStorage.getItem('theme') || 'light');
watch(themeName, newTheme => {
  applyPreset(newTheme);
  localStorage.setItem('theme', newTheme);
});

applyPreset(themeName.value);

const toggleIcons = {
  light: 'light_mode',
  dark: 'dark_mode',
};

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
