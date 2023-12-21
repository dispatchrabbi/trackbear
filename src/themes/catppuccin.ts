import type { Theme } from "../lib/theme.ts";

// catpuccin is from https://github.com/catppuccin/catppuccin
const latteColors = {
  rosewater: 'hsl(11, 59%, 67%)',
  flamingo: 'hsl(0, 60%, 67%)',
  pink: 'hsl(316, 73%, 69%)',
  mauve: 'hsl(266, 85%, 58%)',
  red: 'hsl(347, 87%, 44%)',
  maroon: 'hsl(355, 76%, 59%)',
  peach: 'hsl(22, 99%, 52%)',
  yellow: 'hsl(35, 77%, 49%)',
  green: 'hsl(109, 58%, 40%)',
  teal: 'hsl(183, 74%, 35%)',
  sky: 'hsl(197, 97%, 46%)',
  sapphire: 'hsl(189, 70%, 42%)',
  blue: 'hsl(220, 91%, 54%)',
  lavender: 'hsl(231, 97%, 72%)',
  text: 'hsl(234, 16%, 35%)',
  subtext1: 'hsl(233, 13%, 41%)',
  subtext0: 'hsl(233, 10%, 47%)',
  overlay2: 'hsl(232, 10%, 53%)',
  overlay1: 'hsl(231, 10%, 59%)',
  overlay0: 'hsl(228, 11%, 65%)',
  surface2: 'hsl(227, 12%, 71%)',
  surface1: 'hsl(225, 14%, 77%)',
  surface0: 'hsl(223, 16%, 83%)',
  base: 'hsl(220, 23%, 95%)',
  mantle: 'hsl(220, 22%, 92%)',
  crust: 'hsl(220, 21%, 89%)',
};

const latte: Theme = {
  primary: latteColors.mauve,
  secondary: latteColors.sapphire,
  success: latteColors.green,
  info: latteColors.lavender,
  danger: latteColors.red,
  warning: latteColors.yellow,
  backgroundPrimary: latteColors.base,
  backgroundSecondary: latteColors.mantle,
  backgroundElement: latteColors.surface0,
  backgroundBorder: latteColors.surface2,
  textPrimary: latteColors.text,
  textInverted: latteColors.base,
  shadow: 'rgba(0, 0, 0, 0.12)',
  focus: latteColors.lavender,
};

export {
  latte,
};
