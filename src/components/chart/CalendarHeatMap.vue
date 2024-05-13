<script setup lang="ts">
import { ref, computed, watchEffect, defineProps, withDefaults, onMounted } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import * as d3 from 'd3';

import { usePreferredColorScheme } from '@vueuse/core';
import themeColors from 'src/themes/primevue.ts';

export type CalendarHeatMapDataPoint = {
  date: Date;
  value: unknown;
};
type CalendarHeatMapConfig = {
  cellSize: number;
  padding: number;
  colorScaleSteps: number;
};

const defaultConfig: CalendarHeatMapConfig = {
  cellSize: 16,
  padding: 1,
  colorScaleSteps: 5,
};

const props = withDefaults(defineProps<{
  data: CalendarHeatMapDataPoint[];
  anchor?: 'start' | 'end';
  config?: Partial<CalendarHeatMapConfig>;
  normalizerFn?: (datum: CalendarHeatMapDataPoint, data: CalendarHeatMapDataPoint[]) => number | null;
  valueFormatFn?: (datum: CalendarHeatMapDataPoint) => string;
}>(), {
  anchor: 'start',
  normalizerFn: datum => datum.value == null ? null : (+datum.value) > 0 ? 1 : 0,
  valueFormatFn: datum => datum.value.toString(),
  config: () => ({
    cellSize: 16,
    padding: 1,
    colorScaleSteps: 5,
  }),
});

const config = computed(() => {
  return Object.assign({}, defaultConfig, props.config) as CalendarHeatMapConfig;
});

const sortedData = computed(() => {
  return props.data.toSorted((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
});

const colorScale = computed(() => {
  const preferredColorScheme = usePreferredColorScheme().value;
  const start = preferredColorScheme === 'dark' ? themeColors.surface[950] : themeColors.surface[50];
  const end = preferredColorScheme === 'dark' ? themeColors.primary[400] : themeColors.primary[500];

  const scale = d3.interpolateLab(start, end);
  return scale;
});

// Define formatting functions for the axes and tooltips.
const formatDate = d3.utcFormat("%x");
const formatDay = (i: number) => "SMTWTFS"[i];
const formatMonth = d3.utcFormat("%b");

// Helpers to compute a day’s position in the week.
const timeWeek = d3.utcMonday;
const countDay = (i: number) => (i + 6) % 7;

// other date helpers
const minDate = (a: Date, b: Date) => a < b ? a : b;
const maxDate = (a: Date, b: Date) => a > b ? a : b;

const heatmapContainer = ref(null);
const heatmapContainerWidth = ref(0);
const heatmapSvg = ref(null);
onMounted(() => {
  useResizeObserver(heatmapContainer, entries => {
    heatmapContainerWidth.value = entries[0].contentRect.width;
  });

  const svgEl = d3.select(heatmapSvg.value);

  // With lots of thanks to https://observablehq.com/@d3/calendar/2
  watchEffect(() => {
    const width = heatmapContainerWidth.value;
    const cellSize = config.value.cellSize + config.value.padding;
    const height = (cellSize * 7) + 15; // 7 days + 15px for the month label

    const firstDataWeek = timeWeek(sortedData.value[0].date);
    const lastDataWeek = timeWeek.ceil(sortedData.value[sortedData.value.length - 1].date);
    const weeksVisible = Math.floor(width / cellSize) - 1;
    const firstWeek = props.anchor === 'end' ? maxDate(timeWeek.offset(lastDataWeek, -weeksVisible), firstDataWeek) : firstDataWeek;
    const lastWeek = props.anchor === 'end' ? lastDataWeek : minDate(timeWeek.offset(firstDataWeek, weeksVisible), lastDataWeek);

    const preferredColorScheme = usePreferredColorScheme().value;

    // Helper to compute the color of a data point
    const quantileColor = (normalizedValue: number) => {
      return colorScale.value(normalizedValue);
    }

    // Set up the SVG element
    svgEl
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    // this is a weird way to do it, because it's kind of expecting there to be multiple timelines
    // but I'm not good enough yet at d3 to do it a different way, so for now, here it is
    const timeline = svgEl.selectAll("g")
      .data([sortedData.value.map(datum => ({
        date: datum.date,
        value: datum.value,
        normalized: props.normalizerFn(datum, sortedData.value),
      })).filter((d) => {
        return width > 0 ? (d.date >= firstWeek && d.date <= lastWeek) : true;
      })])
      .join("g")
      .attr('transform', 'translate(0, 13)');

    // Add the weekday legend on the left side
    timeline.append("g")
      .attr("text-anchor", "middle")
    .selectAll()
    .data(d3.range(0, 7))
    .join("text")
      .attr("x", 6)
      .attr("y", i => (countDay(i) + 0.5) * cellSize)
      .attr("dy", "0.31em")
      .style("fill", preferredColorScheme === 'dark' ? themeColors.surface[50] : themeColors.surface[950])
      .text(formatDay);

    // Add the boxes for each day
    timeline.append("g")
      .selectAll()
      .data(d => d) // uses the parent group's (the timeline's) data, but we don't want to alter it at all
      .join("rect")
        .attr("width", cellSize - 1)
        .attr("height", cellSize - 1)
        .attr("x", d => timeWeek.count(firstWeek, d.date) * cellSize + 0.5 + cellSize)
        .attr("y", d => countDay(d.date.getUTCDay()) * cellSize + 0.5)
        .attr("fill", d => quantileColor(d.normalized))
      .append("title")
        .text(d => [formatDate(d.date), props.valueFormatFn(d)].join('\n'));

    // create a group for each month
    const month = timeline.append("g")
      .selectAll()
      .data((data) => d3.utcMonths(d3.utcMonth(data[0].date), data.at(-1).date))
      .join("g");

    // draw an overlay between months to give a little separation
    month.filter((d, i) => i > 0).append("path")
      .attr("fill", "none")
      .attr("stroke", preferredColorScheme === 'dark' ? themeColors.surface[700] : themeColors.surface[200])
      .attr("stroke-width", 2)
      .attr("d", pathMonth);

    // A function that draws a thin line to the left of each month.
    function pathMonth(t) {
      const d = Math.max(0, Math.min(7, countDay(t.getUTCDay())));
      const w = timeWeek.count(firstWeek, t) + 1; // +1 to account for the weekday legend
      return `${d === 0 ? `M${w * cellSize},0`
          : d === 7 ? `M${(w + 1) * cellSize},0`
          : `M${(w + 1) * cellSize},0V${d * cellSize}H${w * cellSize}`}V${7 * cellSize}`;
    }

    // add the month name above the top of the month
    month.append("text")
      .attr("x", d => (timeWeek.count(firstWeek, d) + 2) * cellSize)
      .attr("y", -5)
      .style("fill", preferredColorScheme === 'dark' ? themeColors.surface[50] : themeColors.surface[950])
      .text(formatMonth);
  });
});

</script>

<template>
  <div
    ref="heatmapContainer"
    class="w-full overflow-hidden"
  >
    <svg ref="heatmapSvg" />
  </div>
</template>
