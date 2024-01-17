import { addDays, eachDayOfInterval } from "date-fns";
import { formatDate, parseDateString, maxDateStr, formatTimeProgress } from "src/lib/date.ts";
import { commaify } from "src/lib/number.ts";

export type NormalizedUpdate = {
  date: string;
  rawValue: number;
  rawTotalSoFar: number;
  value: number;
  totalSoFar: number;
};

type GoalOptions = {
  type: string;
  goal: number;
};

function normalizeUpdates(updates: { date: string; value: number}[], goalOpts: GoalOptions = null): NormalizedUpdate[] {
  // first, combine all the updates that happened on the same day
  const consolidatedObj: Record<string, number> = updates.reduce((obj, update) => {
    if(!(update.date in obj)) {
      obj[update.date] = 0;
    }

    obj[update.date] += update.value;
    return obj;
  }, {});
  const consolidatedDates = Object.keys(consolidatedObj);
  const consolidatedUpdates = consolidatedDates.sort().map(date => ({ date, value: consolidatedObj[date] }));

  const normalizedUpdates: NormalizedUpdate[] = [];
  // TODO: recast time goals as minutes, not hours. Bah.
  const normalizedGoal = goalOpts && (goalOpts.type === 'time' ? goalOpts.goal * 60 : goalOpts.goal);
  // we have to use a for loop because .map doesn't update the array as it's going,
  // and we need access to the previous update's running total
  for(let i = 0; i < consolidatedUpdates.length; ++i) {
    const update = consolidatedUpdates[i];

    const rawValue = update.value;
    const value = goalOpts ? (rawValue / normalizedGoal) * 100 : rawValue;
    const rawTotalSoFar = (i === 0 ? rawValue : rawValue + normalizedUpdates[i - 1].rawTotalSoFar);
    // calculate this from scratch each time so we don't depend on floating point math to eventually add to 100.0
    const totalSoFar = goalOpts ? (rawTotalSoFar / normalizedGoal) * 100 : rawTotalSoFar;

    normalizedUpdates.push({
      date: update.date,
      rawValue,
      rawTotalSoFar,
      value,
      totalSoFar,
    });
  }

  return normalizedUpdates;
}

function getEachDayOfChart(nominalStartDate?: string, nominalEndDate?: string, firstUpdate?: string, lastUpdate?: string) {
  const start = determineChartStartDate(firstUpdate, nominalStartDate);
  const end = determineChartEndDate(lastUpdate, nominalEndDate, nominalStartDate);

  let dates = { start: parseDateString(start), end: parseDateString(end) };
  if(dates.end < dates.start) {
    dates = { start: dates.end, end: dates.start };
  }

  const eachDay = eachDayOfInterval(dates).map(formatDate).sort();
  return eachDay;
}
function determineChartStartDate(firstUpdate?: string, nominalStartDate?: string) {
  if(nominalStartDate) {
    return nominalStartDate;
  } else if(firstUpdate) {
    return firstUpdate;
  } else {
    return formatDate(new Date()); // today
  }
}
function determineChartEndDate(lastUpdate?: string, nominalEndDate?: string, nominalStartDate?: string) {
  if(nominalEndDate) {
    return nominalEndDate;
  } else if(lastUpdate) {
    return lastUpdate;
  } else if(nominalStartDate) {
    // display a 7-day chart
    return maxDateStr(formatDate(addDays(parseDateString(nominalStartDate), 6)), formatDate(addDays(new Date(), 6)));
  } else {
    // display a 7-day chart
    return formatDate(addDays(new Date(), 6));
  }
}

function calculatePars(eachDay: string[], normalizedGoal: number | null, endDate?: string) {
  // no way to have par if there's no goal
  if(normalizedGoal === null) {
    return null;
  }

  let pars = [];
  if(endDate) {
    // count up toward the end date
    // TODO: this should be neater and allow for, like, half-chapters
    const parPerDay = normalizedGoal / (eachDay.length);
    pars = eachDay.map((dateStr, ix) => ({
      date: dateStr,
      value: parPerDay,
      totalSoFar: parPerDay * (ix + 1), // start the par line at the first day's goal, not 0
    }));
  } else {
    // just put par at the goal
    pars = eachDay.map((dateStr) => ({
      date: dateStr,
      value: normalizedGoal,
      totalSoFar: normalizedGoal,
    }));
  }

  return pars;
}

function makeTooltipLabelFn(goalType) {
  return function(ctx) {
    const value = ctx.dataset.label === 'Par' ? Math.round(ctx.raw.totalSoFar) : ctx.raw.totalSoFar;

    let valueStr;
    if(goalType === 'time') {
      valueStr = formatTimeProgress(value);
    } else if(goalType === 'percentage') {
      valueStr = Math.round(value) + '%'
    } else {
      valueStr = `${commaify(value)} ${(value === 1 ? ctx.dataset.counter.singular : ctx.dataset.counter.plural)}`;
    }

    return `${ctx.dataset.label}: ${valueStr}`;
  }
}

export {
  normalizeUpdates,
  getEachDayOfChart,
  calculatePars,
  makeTooltipLabelFn,
};
