export function mockObject<T extends object>(partial: Partial<T> = {}): T {
  return partial as T;
}

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';
export const TEST_SESSION_ID = 'mocked';