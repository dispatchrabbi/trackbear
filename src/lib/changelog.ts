import packageJson from '../../package.json' assert { type: 'json' };
import { useLocalStorage } from '@vueuse/core';

export function useLastChangelogViewed() {
  return useLocalStorage('last-changelog-viewed', '0.0.0');
}

export function getCurrentVersion() {
  return packageJson.version;
}

export function cmpVersion(a: string, b: string) {
  const aParts = a.split('.').map(x => +x);
  const bParts = b.split('.').map(x => +x);
  if(aParts.length !== bParts.length) {
    throw new Error(`Cannot compare ${a} and ${b}; they do not have the same number of parts`);
  }

  for(let i = 0; i < aParts.length; ++i) {
    if(aParts[i] < bParts[i]) {
      return -1;
    } else if(aParts[i] > bParts[i]) {
      return 1;
    } // else, on to the next dot down
  }

  return 0;
}
