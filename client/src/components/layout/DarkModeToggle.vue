<script setup lang="ts">
import { computed } from 'vue';
import { useColors } from "vuestic-ui";

const { applyPreset, currentPresetName } = useColors();

const darkModeEnabled = computed({
  get() { return currentPresetName.value; },
  set(value) { applyPreset(value); }
});
</script>

<template>
  <VaSwitch
    v-model="darkModeEnabled"
    true-value="dark"
    false-value="light"
    color="#5123a1"
    off-color="#ffd300"
    style="--va-switch-checker-background-color: #252723;"
  >
    <template #innerLabel>
      <div class="va-text-center">
        <VaIcon
          :name="darkModeEnabled ? 'dark_mode' : 'light_mode'"
        />
      </div>
    </template>
  </VaSwitch>
</template>
