export function mockObject<T extends object>(partial: Partial<T>): T {
  return partial as T;
}