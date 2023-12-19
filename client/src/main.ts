import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes.ts';

import { createVuestic } from 'vuestic-ui';
import "vuestic-ui/css";
import "material-design-icons-iconfont/dist/material-design-icons.min.css";

createApp(App)
  .use(createPinia())
  .use(createRouter({
    history: createWebHistory(),
    routes,
  }))
  .use(createVuestic({
    config: {
      colors: {
        presets: {
          light: { primary: '#5123a1' },
          dark: {
            primary: '#88c0d0',
            textPrimary: '#2e3440',
            textInverted: '#eceff4',
          },
        }
      }
    }
  }))
  .mount('#app');
