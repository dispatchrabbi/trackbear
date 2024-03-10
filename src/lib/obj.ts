export function deepMergeWithDefaults(defaults: object, overrides: object = {}) {
  const out = {...defaults};

  for(const key of Object.keys(overrides)) {
    if(typeof defaults[key] === 'object' && typeof overrides[key] === 'object') {
      out[key] = deepMergeWithDefaults(defaults[key], overrides[key]);
    } else {
      out[key] = overrides[key];
    }
  }

  return out;
}
