import "core-js/stable"; // polyfill for older browsers
import { createApp, type Plugin, type Directive } from 'vue';

import App from './App.vue';

import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes.ts';

// import our baseline app styles
import 'primeicons/primeicons.css';
import './style.css';

import { initPlausible } from './lib/metrics.ts';
initPlausible();

import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
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
  .use(ConfirmationService as unknown as Plugin)
  .use(PrimeVue as unknown as Plugin, {
    ripple: true,
    unstyled: true,
    pt: Wind,
  })
  .directive('tooltip', Tooltip as unknown as Directive)
  .directive('ripple', Ripple as unknown as Directive)
  .mount('#app');