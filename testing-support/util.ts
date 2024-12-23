import { type RequestContext } from "server/lib/request-context";

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';
export const TEST_UUID = '8fb3e519-fc08-477f-a70e-4132eca599d4';
export const TEST_USER_ID = -10;
export const TEST_SESSION_ID = 'mocked';

export function mockObject<T extends object>(partial: Partial<T> = {}): T {
  return partial as T;
}

export function mockObjects<T extends object>(count: number, propFn: () => Partial<T> = () => ({})): T[] {
  return Array(count).fill(null).map(propFn) as T[];
}

export function getTestReqCtx(): RequestContext {
  return {
    userId: TEST_USER_ID,
    sessionId: TEST_SESSION_ID,
  };
};