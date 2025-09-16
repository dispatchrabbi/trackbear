export function deepMergeWithDefaults(defaults: object, overrides: object = {}) {
  const out = { ...defaults };

  for(const key of Object.keys(overrides)) {
    if(typeof defaults[key] === 'object' && typeof overrides[key] === 'object') {
      out[key] = deepMergeWithDefaults(defaults[key], overrides[key]);
    } else {
      out[key] = overrides[key];
    }
  }

  return out;
}

export function mapObject<T extends object, M>(obj: T, fn: (key: keyof T, value: T[keyof T]) => M) {
  const entries = Object.entries(obj);
  const mapped = entries.map<[string, M]>(entry => ([
    entry[0],
    fn(entry[0] as keyof T, entry[1]),
  ]));
  return Object.fromEntries(mapped);
}
