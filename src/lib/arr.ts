export function getRandomElement<T>(arr: [T, ...T[]]): T {
  const ix = Math.floor(Math.random() * arr.length);
  return arr[ix];
}
