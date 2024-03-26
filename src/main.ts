import { createApp, Plugin, Directive } from 'vue';

import App from './App.vue';

import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes.ts';

// import our baseline app styles
import 'primeicons/primeicons.css';
import './assets/primevue.css';
import './style.css';

import { useThemeStore } from './stores/theme.ts';

import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import Ripple from 'primevue/ripple';
import Wind from 'src/themes/primevue-presets/wind/index.js';

createApp(App)
  .use(createPinia())
  .use(createRouter({
    history: createWebHistory(),
    routes,
  }))
  .use(ToastService as unknown as Plugin)
  .use(PrimeVue as unknown as Plugin, {
    ripple: true,
    unstyled: true,
    pt: Wind,
  })
  .directive('tooltip', Tooltip as unknown as Directive)
  .directive('ripple', Ripple as unknown as Directive)
  .mount('#app');

const themeStore = useThemeStore();
themeStore.applyTheme();
