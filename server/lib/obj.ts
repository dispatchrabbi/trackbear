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
