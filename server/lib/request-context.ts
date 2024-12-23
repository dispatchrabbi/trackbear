import { UNKNOWN_ACTOR_ID } from "./audit-events";

export type RequestContext = {
  userId: number | null;
  sessionId: string;
};

interface RequestWithOrWithoutUser {
  sessionID: string;
  user?: { id: number };
}

export function reqCtx(req: RequestWithOrWithoutUser): RequestContext {
  return {
    userId: ('user' in req) ? req.user.id : UNKNOWN_ACTOR_ID,
    sessionId: req.sessionID,
  };
}