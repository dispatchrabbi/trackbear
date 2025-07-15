// .vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import './custom.css';

import { theme, useTheme, useOpenapi } from 'vitepress-openapi/client';
import 'vitepress-openapi/dist/style.css';

import spec from '../../public/openapi/openapi.json' with { type: 'json' };

// export default DefaultTheme;

export default {
  extends: DefaultTheme,
  async enhanceApp({ app, router, siteData }) {
    useTheme({
      jsonViewer: {
        renderer: 'shiki',
      },
      playground: {
        jsonEditor: {
          mode: 'text',
        },
      },
      operation: {
        slots: [
          'header',
          'path',
          'description',
          'request-body',
          'responses',
          'playground',
          'code-samples',
          'footer',
        ],
      },
    });

    useOpenapi({ spec });

    theme.enhanceApp({ app, router, siteData });
  },
} satisfies Theme;
