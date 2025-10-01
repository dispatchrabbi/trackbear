import { reactive } from 'vue';

type WorkFunction<T, A extends unknown[]> = (...args: A) => Promise<T>;
type OnErrorFunction = (e: Error) => Promise<string | null>;
type OnSuccessFunction<T> = (result: T) => Promise<string | null>;
type OnFinallyFunction = (successful: boolean | null) => Promise<void>;

type WorkSignals = {
  isLoading: boolean;
  successMessage: string | null;
  errorMessage: string | null;
};

type DoWorkFunction<A extends unknown[]> = (...args: A) => Promise<void>;

type ResetFunction = () => void;

export function useAsyncSignals<T, A extends unknown[]>(
  workFn: WorkFunction<T, A>,
  onError: OnErrorFunction = defaultOnError,
  onSuccess: OnSuccessFunction<T> = defaultOnSuccess,
  onFinally: OnFinallyFunction = defaultOnFinally,
): [DoWorkFunction<A>, WorkSignals, ResetFunction] {
  const signals = reactive<WorkSignals>({
    isLoading: false,
    successMessage: null,
    errorMessage: null,
  });

  const fn = async function(...args: A) {
    signals.isLoading = true;
    signals.successMessage = null;
    signals.errorMessage = null;

    let successful: boolean | null = null;
    try {
      const result = await workFn(...args);

      const successMessage = await onSuccess(result);
      signals.successMessage = successMessage ?? null;
      successful = true;
    } catch (e) {
      const errorMessage = await onError(e);
      signals.errorMessage = errorMessage ?? null;
      successful = false;
    } finally {
      signals.isLoading = false;
      await onFinally(successful);
    }
  };

  const reset = function() {
    signals.isLoading = false;
    signals.successMessage = null;
    signals.errorMessage = null;
  };

  // these are exported as an array so it's easier to rename them on destructure
  return [
    fn,
    signals,
    reset,
  ];
}

export async function defaultOnError(e: Error): Promise<string> {
  return e.message;
}

export async function defaultOnSuccess(/* result: unknown */): Promise<null> {
  return null;
}

export async function defaultOnFinally(): Promise<void> { }
