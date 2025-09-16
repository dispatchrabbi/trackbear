export const USER_COLOR_NAMES = [
  'red', 'orange', 'amber', 'yellow',
  'lime', 'green', 'teal',
  'cyan', 'sky', 'blue', 'violet', 'purple',
  'fuchsia', 'pink', 'rose',
  'gray',
];
export function userColorOrFallback(color: string): string {
  return USER_COLOR_NAMES.includes(color) ? color : '';
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function userColorLevel(theme: string) {
  return 500;
}
