import { createApp } from 'vue';
import './style.css';

import App from './App.vue';

import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes.ts';

// import each component here for tree-shakability
import {
  createVuesticEssential,
  VaNavbar, VaNavbarItem, VaDataTable,
  VaCard, VaCardContent, VaCardTitle,
  VaForm, VaDateInput, VaInput, VaRadio, VaSelect, VaSwitch,
  VaList, VaListItem, VaListItemLabel, VaListItemSection,
  VaSkeleton, VaSkeletonGroup,
  VaAlert, VaAvatar, VaButton, VaIcon, VaImage, VaPopover,
  VaModal, VaModalPlugin,
} from 'vuestic-ui';
import "vuestic-ui/css";
import "material-design-icons-iconfont/dist/material-design-icons.min.css";

import themes from './themes/index.ts';
import { useThemeStore } from './stores/theme.ts';

createApp(App)
  .use(createPinia())
  .use(createRouter({
    history: createWebHistory(),
    routes,
  }))
  .use(createVuesticEssential({
    components: {
      VaNavbar, VaNavbarItem, VaDataTable,
      VaCard, VaCardContent, VaCardTitle,
      VaForm, VaDateInput, VaInput, VaRadio, VaSelect, VaSwitch,
      VaList, VaListItem, VaListItemLabel, VaListItemSection,
      VaSkeleton, VaSkeletonGroup,
      VaAlert, VaAvatar, VaButton, VaIcon, VaImage, VaPopover,
      VaModal,
    },
    plugins: {
      VaModalPlugin,
    },
    config: {
      colors: {
        presets: {
          light: themes.light,
          dark: themes.nordDark,
          ...themes,
        }
      }
    }
  }))
  .mount('#app');

const themeStore = useThemeStore();
themeStore.applyTheme();
