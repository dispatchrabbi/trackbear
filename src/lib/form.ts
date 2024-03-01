import { computed } from 'vue';
import { ZodObject, ZodRawShape } from "zod";

export function useValidation<T>(schema: ZodObject<ZodRawShape>, model: T) {
  const ruleFor = function(field: string) {
    if(!(field in schema.shape)) {
      throw new Error(`Cannot make a rule for ${field}, no matching field found in schema`);
    }

    return function(v: unknown) {
      const result = schema.shape[field].safeParse(v);
      return (result.success === true) || result.error.errors[0].message;
    };
  }

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
          return result.error.errors[0].message;
        }
      }

      return true;
    }
  }

  const validate = function(): boolean {
    return schema.safeParse(model).success;
  }

  const isValid = computed(() => validate());

  const formData = function() {
    return schema.parse(model);
  }

  return {
    ruleFor,
    rulesFor,
    validate,
    isValid,
    formData,
  };
}
