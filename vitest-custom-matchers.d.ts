import 'vitest';

interface CustomMatchers<R = unknown> {
  toSucceedWith: <T>(status: number, payload: T) => R;
  toFailWith: (status: number, code: string, message?: string) => R;
}

declare module 'vitest' {
  /* eslint-disable @typescript-eslint/no-empty-object-type */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
  /* eslint-enable @typescript-eslint/no-empty-object-type */
}

export {};
