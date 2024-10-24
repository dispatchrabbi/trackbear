import { useLocalStorage, usePreferredColorScheme } from "@vueuse/core";
import { computed, watchEffect } from "vue";
import { PrimeIcons } from "primevue/api";

export const THEME_OPTIONS = [
  { label: 'Auto', value: 'auto', icon: PrimeIcons.GLOBE },
  { label: 'Light', value: 'light', icon: PrimeIcons.SUN },
  { label: 'Dark', value: 'dark', icon: PrimeIcons.MOON },
];

export const LOGO = {
  light: '/images/brown-bear.png',
  dark: '/images/polar-bear.png',
};

const theme = useLocalStorage('theme', 'auto');
const systemTheme = usePreferredColorScheme();

const computedTheme = computed(() => {
  return theme.value === 'auto' ? systemTheme.value === 'no-preference' ? 'light' : systemTheme.value : theme.value;
});

watchEffect(() => {
  window.document.body.dataset.theme = computedTheme.value;
  (window.document.querySelector('link[rel="icon"]') as HTMLLinkElement).href = LOGO[computedTheme.value] ?? LOGO['light'];
});

export function useTheme() {
  return { theme, computedTheme };
}

export type LegacyTheme_DEPRECATED = {
  primary: string;
  secondary: string;
  success: string;
  info: string;
  danger: string;
  warning: string;
  backgroundPrimary: string;
  backgroundSecondary: string;
  backgroundElement: string;
  backgroundBorder: string;
  textPrimary: string;
  textInverted: string;
  shadow: string;
  focus: string;
};
