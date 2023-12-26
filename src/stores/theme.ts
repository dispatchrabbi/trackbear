import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
  state: () => {
    return {
      theme: localStorage.getItem('theme') || 'light',
    };
  },
  actions: {
    applyTheme(theme?: string) {
      if(theme !== undefined) {
        this.theme = theme;
      }

      localStorage.setItem('theme', this.theme);
    }
  }
});
