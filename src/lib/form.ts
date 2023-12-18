import { computed } from 'vue';
import { ZodObject, ZodRawShape } from "zod";

export function useValidation<T>(schema: ZodObject<ZodRawShape>, model: T) {
  const ruleFor = function(field: string) {
    if(!(field in schema.shape)) {
      throw new Error(`Cannot make a rule for ${field}, no matching field found in schema`);
    }

    return function(v: string) {
      const result = schema.shape[field].safeParse(v);
      return (result.success === true) || result.error.errors[0].message;
    };
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
    validate,
    isValid,
    formData,
  };
}
