import colors from 'tailwindcss/colors.js';

export const primary = colors.indigo;
export const accent = colors.amber;
export const surface = {
  '1000': '#000000',
  ...colors.stone,
  '0': '#ffffff',
};

export const secondary = surface;
export const success = colors.green;
export const info = colors.blue;
export const warning = colors.orange;
export const help = colors.purple;
export const danger = colors.red;
export const contrast = surface;

export const error = colors.red;

export default {
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
};
