import { computed } from 'vue';
import { ZodObject, ZodRawShape } from 'zod';
import type { RoundTrip } from 'src/lib/api';

export function useValidation<T extends object, V extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>>(schema: V, model: T) {
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
    const rules = [];

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
          console.log('rulesFor', result, rule);
          return result.error.errors[0].message;
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

  const formData = function(): RoundTrip<T> {
    return schema.parse(model) as RoundTrip<T>;
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
