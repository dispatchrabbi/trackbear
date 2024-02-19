/** @type {import('tailwindcss').Config} */

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
			'primary-50': 'rgb(var(--primary-50))',
			'primary-100': 'rgb(var(--primary-100))',
			'primary-200': 'rgb(var(--primary-200))',
			'primary-300': 'rgb(var(--primary-300))',
			'primary-400': 'rgb(var(--primary-400))',
			'primary-500': 'rgb(var(--primary-500))',
			'primary-600': 'rgb(var(--primary-600))',
			'primary-700': 'rgb(var(--primary-700))',
			'primary-800': 'rgb(var(--primary-800))',
			'primary-900': 'rgb(var(--primary-900))',
			'primary-950': 'rgb(var(--primary-950))',
			'surface-0': 'rgb(var(--surface-0))',
			'surface-50': 'rgb(var(--surface-50))',
			'surface-100': 'rgb(var(--surface-100))',
			'surface-200': 'rgb(var(--surface-200))',
			'surface-300': 'rgb(var(--surface-300))',
			'surface-400': 'rgb(var(--surface-400))',
			'surface-500': 'rgb(var(--surface-500))',
			'surface-600': 'rgb(var(--surface-600))',
			'surface-700': 'rgb(var(--surface-700))',
			'surface-800': 'rgb(var(--surface-800))',
			'surface-900': 'rgb(var(--surface-900))',
			'surface-950': 'rgb(var(--surface-950))'
	}
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
