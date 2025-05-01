import { computed } from 'vue';
import { useTheme } from 'src/lib/theme';
import twColors from 'tailwindcss/colors.js';
import themeColors from 'src/themes/primevue.ts';

type ChartColors = {
  text: string;
  secondaryText: string;
  background: string;
  par: string;
  data: string[];
};

const LIGHT_CHART_COLORS: ChartColors = {
  text: themeColors.surface[900],
  secondaryText: themeColors.surface[300],
  background: themeColors.surface[50],
  par: themeColors.primary[500],
  data: createColorCycle(
    ['red', 'orange', 'yellow', 'green', 'blue', 'purple'],
    ['400', '600', '800'],
  ),
};

const DARK_CHART_COLORS: ChartColors = {
  text: themeColors.surface[50],
  secondaryText: themeColors.surface[600],
  background: themeColors.surface[800],
  par: themeColors.primary[300],
  data: createColorCycle(
    ['red', 'orange', 'yellow', 'green', 'blue', 'purple'],
    ['700', '500', '300'],

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
  const cycle = [];

  for(const level of colorLevels) {
    for(const name of colorNames) {
      cycle.push(twColors[name][level]);
    }
  }

  return cycle;
}
