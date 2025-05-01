import { addDays } from 'date-fns';
import { parseDateString, formatDate, Dated } from './date.ts';

export function findStreaks(tallies: Dated[]): string[][] {
  const tallyDates = [...(new Set(tallies.map(tally => tally.date)))].sort();

  const streaks = [];
  for(let i = 0; i < tallyDates.length; ++i) {
    const thisTallyDate = tallyDates[i];

    // if the last date we logged wasn't the day before the current day, start a new streak
    const lastTallyDate = tallyDates[i - 1];
    const yesterdayFromThisTallyDate = formatDate(addDays(parseDateString(thisTallyDate), -1));
    if(lastTallyDate !== yesterdayFromThisTallyDate) {
      // time to start a new streak
      streaks.push([]);
    }

    // add this date to the current streak
    streaks[streaks.length - 1].push(thisTallyDate);
  }

  // if the last date of the last streak isn't today or yesterday, add a new, empty streak
  const today = formatDate(new Date());
  const yesterday = formatDate(addDays(new Date(), -1));
  const lastDateOfTheLastStreak = tallyDates[tallyDates.length - 1];

  if(![today, yesterday].includes(lastDateOfTheLastStreak)) {
    streaks.push([]);
  }

  return streaks;
}

export function getStreakInfo(tallies: Dated[]) {
  const streaks = findStreaks(tallies);

  const currentStreak = streaks[streaks.length - 1];
  const longestStreak = streaks.reduce((longest, streak) => streak.length >= longest.length ? streak : longest, []);
  const isCurrentStreakLongest = (currentStreak === longestStreak);
  const hasEnteredProgressToday = currentStreak[currentStreak.length - 1] === formatDate(new Date());

  return {
    streaks,
    currentStreak,
    longestStreak,
    isCurrentStreakLongest,
    hasEnteredProgressToday,
  };
}
