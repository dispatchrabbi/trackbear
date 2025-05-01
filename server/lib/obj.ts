export function omit<O extends object, K extends keyof O>(obj: O, keys: K[]): { [J in Exclude<keyof O, K>]: O[J] } {
  const out = {} as O;

  let key: keyof O;
  for(key in obj) {
    if(!keys.includes(key as K)) {
      out[key] = obj[key];
    }
  }

  return out;
}

export function pick<O extends object, K extends keyof O>(obj: O, keys: K[]): { [J in K]: O[J] } {
  const out = {} as O;

  let key: keyof O;
  for(key in obj) {
    if(keys.includes(key as K)) {
      out[key] = obj[key];
    }
  }

  return out;
}

export type ValueEnum<T extends Record<string, unknown>> = T[keyof T];

// these two types are utility types that "collapse" types by actually doing the type algebra and showing you the result
export type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends infer O
    ? { [K in keyof O]: O[K] }
    : never;

export type ExpandRecursively<T> = T extends (...args: infer A) => infer R
  ? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
  : T extends object
    ? T extends infer O
      ? { [K in keyof O]: ExpandRecursively<O[K]> }
      : never
    : T;
