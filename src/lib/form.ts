import { computed, watch, type Ref } from 'vue';
import { type ZodObject, type ZodType } from 'zod';
import type { RoundTrip } from 'src/lib/api';
import wait from './wait';
import { mapObject } from './obj';

function useDirtyTracker<M extends object>(model: Ref<M>) {
  const initialCopy = Object.assign({}, model.value);
  const dirtyFields = new Set<string>();

  watch(model, newModel => {
    for(const key of Object.keys(newModel)) {
      if(newModel[key] !== initialCopy[key]) {
        dirtyFields.add(key);
      }
    }
  }, { deep: 1 });

  return dirtyFields;
}

export function useModelValidation<M extends object>(schema: ZodObject, model: Ref<M>) {
  const dirtyTracker = useDirtyTracker(model);

  const validationResults = computed(() => {
    return schema.safeParse(model.value);
  });

  const isValid = computed(() => {
    return validationResults.value.success;
  });

  const allValidationMessages = computed(() => {
    const issues = validationResults.value.error?.issues ?? [];
    const groupedByPath = Object.groupBy(issues, issue => issue.path.join('.'));

    // remove any paths that aren't dirty
    // TODO: this only works down to depth 1
    for(const pathKey of Object.keys(groupedByPath)) {
      if(!dirtyTracker.has(pathKey)) {
        delete groupedByPath[pathKey];
      }
    }

    return groupedByPath;
  });

  const validationMessages = computed(() => {
    return mapObject(allValidationMessages.value, (key, errors) => errors!.length > 0 ? errors![0].message : null);
  });

  const isFieldInvalid = computed(() => {
    return mapObject(allValidationMessages.value, (key, errors) => errors!.length > 0);
  });

  const getParsedData = function() {
    return schema.parse(model.value);
  };

  return {
    isValid,
    validationResults,
    allValidationMessages,
    validationMessages,
    isFieldInvalid,
    getParsedData,
  };
}

export function useValidation<M extends object>(schema: ZodObject, model: M) {
  const ruleFor = function(field: string) {
    if(!(field in schema.shape)) {
      throw new Error(`Cannot make a rule for ${field}, no matching field found in schema`);
    }

    return function(v: unknown) {
      const result = schema.shape[field].safeParse(v);
      return (result.success === true) || result.error.errors[0].message;
    };
  };

  const rulesFor = function(fields: string[]) {
    const rules: {
      field: string;
      test: ZodType;
    }[] = [];

    for(const field of fields) {
      if(!(field in schema.shape)) {
        throw new Error(`Cannot make a rule for ${field}, no matching field found in schema`);
      }

      rules.push({
        field,
        test: schema.shape[field],
      });
    }

    return function(v: object): string | true {
      for(const rule of rules) {
        const result = rule.test.safeParse(v[rule.field]);

        if(result.success !== true) {
          return result.error.issues[0].message;
        }
      }

      return true;
    };
  };

  const validate = function(): boolean {
    return schema.safeParse(model).success;
  };

  const isValid = computed(() => validate());

  const validationResults = computed(() => schema.safeParse(model));

  const formData = function(): RoundTrip<M> {
    return schema.parse(model) as RoundTrip<M>;
  };

  return {
    ruleFor,
    rulesFor,
    validate,
    isValid,
    validationResults,
    formData,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type formSuccessEmitFn = (event: 'formSuccess', ...args: any[]) => void;
export function emitSuccess(emit: formSuccessEmitFn) {
  return async function() {
    await wait(1000);
    emit('formSuccess');
  };
}
