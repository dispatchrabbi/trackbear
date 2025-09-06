import { type RequestContext } from 'server/lib/request-context';

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';
export const TEST_UUID = '8fb3e519-fc08-477f-a70e-4132eca599d4';
export const TEST_USER_ID = -10;
export const TEST_OBJECT_ID = -20;
export const TEST_SESSION_ID = 'mocked';
export const TEST_SYSTEM_ID = -2;
export const TEST_API_TOKEN = 'tb.test-api-token-rawr';

export function mockObject<T extends object>(partial: Partial<T> = {}): T {
  return partial as T;
}

type PropFn<T> = (ix: number) => Partial<T>;
export function mockObjects<T extends object>(count: number, propFn: PropFn<T> = () => ({})): T[] {
  return Array(count).fill(null).map((_, ix) => propFn(ix)) as T[];
}

export function getTestReqCtx(overrideUserId: number | null = null): RequestContext {
  return {
    userId: overrideUserId ?? TEST_USER_ID,
    sessionId: TEST_SESSION_ID,
  };
};
