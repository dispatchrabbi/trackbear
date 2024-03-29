/** @type {import('tailwindcss').Config} */

// import colors from 'tailwindcss/colors';
import { primary, surface } from './src/themes/primevue.ts';

const PRIMEVUE_EXTEND = {
	colors: {
		transparent: 'transparent',
		current: 'currentColor',
		primary,
		'surface-0': '#ffffff',
		surface,
	},
	fontFamily: {
		sans: ['Jost', 'sans-serif'],
	},
};

export default {
  content: [
		'./src/**/*.{vue,js,ts,jsx,tsx}',
		'./index.html',
  ],
	theme: {
		extend: Object.assign({}, PRIMEVUE_EXTEND),
	}
};
