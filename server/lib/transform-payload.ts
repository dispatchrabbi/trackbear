type Mapping<In, Out> = { [key in (keyof In & keyof Out)]: (value: In[key]) => Out[key] };

export function transformPayload<In, Out>(payload: In, transformers: Partial<Mapping<In, Out>>): Out {
  const transformed = {} as Out;

  for(const key of Object.keys(payload)) {
    if(key in transformers) {
      transformed[key] = transformers[key](payload[key]);
    } else {
      transformed[key] = payload[key];
    }
  }

  return transformed;
}