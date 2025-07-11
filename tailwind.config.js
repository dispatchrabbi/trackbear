/** @type {import('tailwindcss').Config} */

// import colors from 'tailwindcss/colors';
import {
  primary,
  accent,
  surface,

  secondary,
  success,
  info,
  warning,
  help,
  danger,
  contrast,

  error,
} from './src/themes/primevue.ts';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function invert(colorSet) {
  return Object.keys(colorSet).reduce((inverted, level) => {
    inverted[1000 - level] = colorSet[level];
    return inverted;
  }, {});
}

export default {
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './index.html',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',

        primary,
        accent,
        surface,

        secondary,
        success,
        info,
        warning,
        help,
        danger,
        contrast,

        error,
      },
      fontFamily: {
        sans: ['Jost', 'sans-serif'],
        mono: ['Overpass Mono', 'monospace'],
      },
      aspectRatio: {
        '2/3': '2 / 3',
      },
    },
  },
};
