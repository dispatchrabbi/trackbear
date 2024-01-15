import { createApp } from 'vue';

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
  VaMenu, VaMenuList, VaMenuItem, VaDivider,
  VaSkeleton, VaSkeletonGroup, VaProgressCircle,
  VaAlert, VaAvatar, VaBadge, VaButton, VaButtonDropdown, VaChip, VaIcon, VaImage, VaPopover,
  VaModal, VaModalPlugin,
} from 'vuestic-ui';

// import individual stylesheets for tree-shakeability and to be able to remove grid.css
import "vuestic-ui/styles/reset.css";
import "vuestic-ui/styles/essential.css";
import "vuestic-ui/styles/typography.css";
// disabled to remove that pesky flex > * rule (see https://github.com/epicmaxco/vuestic-ui/issues/1927)
// import "vuestic-ui/styles/grid.css";
import "material-design-icons-iconfont/dist/material-design-icons.min.css";

import './style.css';

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
      VaMenu, VaMenuList, VaMenuItem, VaDivider,
      VaSkeleton, VaSkeletonGroup, VaProgressCircle,
      VaAlert, VaAvatar, VaBadge, VaButton, VaButtonDropdown, VaChip, VaIcon, VaImage, VaPopover,
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
      },
    },
  }))
  .mount('#app');

const themeStore = useThemeStore();
themeStore.applyTheme();
