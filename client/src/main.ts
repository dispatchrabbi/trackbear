import { createApp } from 'vue';
import './style.css';

import App from './App.vue';

import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes.ts';

import { createVuestic } from 'vuestic-ui';
import "vuestic-ui/css";
import "material-design-icons-iconfont/dist/material-design-icons.min.css";

import themes from './themes.ts';

createApp(App)
  .use(createPinia())
  .use(createRouter({
    history: createWebHistory(),
    routes,
  }))
  .use(createVuestic({
    config: {
      colors: {
        presets: themes
      }
    }
  }))
  .mount('#app');
