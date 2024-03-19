/** @type {import('tailwindcss').Config} */

// import colors from 'tailwindcss/colors';
import { primary, surface } from './src/themes/primevue.ts';

// const VUESTIC_EXTEND = {
// 	colors: {
// 		// primary: '#154EC1',
// 		primary: '#5123a1',
// 		secondary: '#767C88',
// 		success: '#3D9209',
// 		info: '#158DE3',
// 		danger: '#E42222',
// 		warning: '#FFD43A',
// 		backgroundPrimary: '#f6f6f6',
// 		backgroundSecondary: '#FFFFFF',
// 		backgroundElement: '#ECF0F1',
// 		backgroundBorder: '#DEE5F2',
// 		textPrimary: '#262824',
// 		textInverted: '#FFFFFF',
// 		shadow: 'rgba(0, 0, 0, 0.12)',
// 		focus: '#49A8FF',
// 	},
// 	screens: {
// 		xs: '0px',
// 		sm: '640px',
// 		md: '1024px',
// 		lg: '1440px',
// 		xl: '1920px',
// 	},
// };

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
		extend: Object.assign({}, /* VUESTIC_EXTEND,*/ PRIMEVUE_EXTEND),
	}
};
