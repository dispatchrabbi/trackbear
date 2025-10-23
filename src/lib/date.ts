import { parseISO, format } from 'date-fns';

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export function parseDateString(dateString: string, forceUTC: boolean = false): Date {
  const isDateString = DATE_STRING_REGEX.test(dateString);
  if(!isDateString) {
    throw new Error(`${dateString} is not a datestring!`);
  }

  // Temporal when
  return parseISO(dateString + (forceUTC ? 'T00:00:00Z' : ''));
}

export function parseDateStringSafe(dateString: string | null, forceUTC: boolean = false): Date | null {
  if(dateString === null) {
    return null;
  }

  const isDateString = DATE_STRING_REGEX.test(dateString);
  if(!isDateString) { return null; }

  // Temporal when
  return parseISO(dateString + (forceUTC ? 'T00:00:00Z' : ''));
}

export function formatDate(date: Date, forceUTC: boolean = false): string {
  const year = String(forceUTC ? date.getUTCFullYear() : date.getFullYear());

  let month = String((forceUTC ? date.getUTCMonth() : date.getMonth()) + 1);
  if(month.length === 1) {
    month = '0' + month;
  }

  let day = String(forceUTC ? date.getUTCDate() : date.getDate());
  if(day.length === 1) {
    day = '0' + day;
  }

  return `${year}-${month}-${day}`;
}

export function formatDateSafe(date: Date | null | undefined, forceUTC: boolean = false): string | null {
  if(date === null || date === undefined) {
    return null;
  } else {
    return formatDate(date, forceUTC);
  }
}

export function formatDuration(totalMinutes, omitZeroMinutes = false, forceColon = false) {
  const hours = '' + Math.floor(Math.abs(totalMinutes / 60)) * Math.sign(totalMinutes);

  let minutes = '' + Math.abs(totalMinutes) % 60;
  if(minutes.length < 2) {
    minutes = '0' + minutes;
  }

  if(forceColon) {
    return `${hours}:${minutes}`;
  } else if(omitZeroMinutes && minutes == '00') {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}

export function minDate<T extends Date | string>(a: T, b: T) {
  return a < b ? a : b;
}

export function maxDate<T extends Date | string>(a: T, b: T) {
  return a > b ? a : b;
}

export function validateTimeString(timeString: string) {
  const parts = timeString.split(':');
  const timeIsValid = parts.length === 2 &&
    parseInt(parts[0], 10) === +parts[0] && Number.isInteger(+parts[0]) &&
    parseInt(parts[1], 10) === +parts[1] && Number.isInteger(+parts[1]) && +parts[1] < 60;

  return timeIsValid;
}

export function formatDateRange(startDate: string, endDate: string, formatString: string, forceUTC: boolean = false) {
  const startDateFormatted = formatString ? format(parseDateString(startDate, forceUTC), formatString) : startDate;
  const endDateFormatted = formatString ? format(parseDateString(endDate, forceUTC), formatString) : endDate;

  if(startDate === endDate) {
    return startDateFormatted;
  } else {
    return startDateFormatted + '  – ' + endDateFormatted;
  }
}

export type Dated = {
  date: string;
};

export function cmpByDate(a: Dated, b: Dated) {
  return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
}
