const light = {
  primary: '#5123a1',
  secondary: '#767C88',
  success: '#3D9209',
  info: '#158DE3',
  danger: '#E42222',
  warning: '#FFD43A',
  backgroundPrimary: '#f6f6f6',
  backgroundSecondary: '#FFFFFF',
  backgroundElement: '#ECF0F1',
  backgroundBorder: '#DEE5F2',
  textPrimary: '#262824',
  textInverted: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.12)',
  focus: '#49A8FF',
};

const dark = Object.assign({}, light, {
  primary: '#88c0d0',
  secondary: '#81a1c1',
  success: '#a3be8c',
  info: '#b48ead',
  danger: '#bf616a',
  warning: '#ebcb8b',
  backgroundPrimary: '#2e3440',
  backgroundSecondary: '#3b4252',
  backgroundElement: '#434c5e',
  backgroundBorder: '#4c566a',
  textPrimary: '#2e3440',
  textInverted: '#eceff4',
  shadow: 'rgba(0, 0, 0, 0.12)',
  focus: '#d08770',
});

export default {
  light,
  dark,
};
