const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export function parseDateString(dateString: string): Date {
  const isDateString = DATE_STRING_REGEX.test(dateString);
  if(!isDateString) { throw new Error(`${dateString} is not a datestring!`); }

  // Temporal when
  return new Date(Date.parse(dateString + 'T00:00:00Z'));
}
