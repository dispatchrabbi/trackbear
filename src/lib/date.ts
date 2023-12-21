import { parseISO } from 'date-fns';

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export function parseDateString(dateString: string): Date {
  const isDateString = DATE_STRING_REGEX.test(dateString);
  if(!isDateString) { throw new Error(`${dateString} is not a datestring!`); }

  // Temporal when
  return parseISO(dateString);
}

export function parseDateStringSafe(dateString: string): Date | null {
  const isDateString = DATE_STRING_REGEX.test(dateString);
  if(!isDateString) { return null; }

  // Temporal when
  return parseISO(dateString);
}

export function formatDate(date: Date) {
  const year = '' + date.getFullYear();

  let month = '' + (date.getMonth() + 1);
  if(month.length === 1) { month = '0' + month; }

  let day = '' + date.getDate();
  if(day.length === 1) { day = '0' + day; }

  return `${year}-${month}-${day}`;
}

export function formatTimeProgress(totalMinutes) {
  const hours = '' + Math.floor(totalMinutes / 60);

  let minutes = '' + totalMinutes % 60;
  if(minutes.length < 2) {
    minutes = '0' + minutes;
  }

  return `${hours}:${minutes}`;
}

export function minDateStr(a, b) {
  return a < b ? a : b;
}

export function maxDateStr(a, b) {
  return a > b ? a : b;
}