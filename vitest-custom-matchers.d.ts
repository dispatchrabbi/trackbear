import 'vitest';

interface CustomMatchers<R = unknown> {
  toSucceedWith: <T>(status: number, payload: T) => R,
  toFailWith: (status: number, code: string, message?: string) => R,
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

export {};