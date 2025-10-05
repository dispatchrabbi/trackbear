import { computed } from 'vue';
import { useTheme } from 'src/lib/theme';
import twColors from 'tailwindcss/colors.js';
import themeColors from 'src/themes/primevue.ts';

export type ChartColors = {
  theme: 'light' | 'dark';
  text: string;
  secondaryText: string;
  background: string;
  par: string;
  data: string[];
};

const LIGHT_CHART_COLORS: ChartColors = {
  theme: 'light',
  text: themeColors.surface[950],
  secondaryText: themeColors.surface[300],
  background: themeColors.surface[0],
  par: themeColors.primary[500],
  data: createColorCycle(
    ['red', 'orange', 'green', 'blue', 'purple', 'pink'],
    ['500', '600', '400'],
  ),
};

const DARK_CHART_COLORS: ChartColors = {
  theme: 'dark',
  text: themeColors.surface[0],
  secondaryText: themeColors.surface[600],
  background: themeColors.surface[800],
  par: themeColors.primary[300],
  data: createColorCycle(
    ['red', 'orange', 'green', 'blue', 'purple', 'pink'],
    ['500', '400', '600'],

  ),
};

const THEME_CHART_COLORS = {
  light: LIGHT_CHART_COLORS,
  dark: DARK_CHART_COLORS,
};

const chartColors = computed<ChartColors>(() => {
  const { theme } = useTheme();

  return THEME_CHART_COLORS[theme.value];
});
export function useChartColors() {
  return chartColors;
}

function createColorCycle(colorNames: string[], colorLevels: string[]) {
  const cycle: string[] = [];

  for(const level of colorLevels) {
    for(const name of colorNames) {
      cycle.push(twColors[name][level]);
    }
  }

  return cycle;
}
