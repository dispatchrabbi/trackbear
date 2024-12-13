import { RequestWithUser } from "./middleware/access";

export type RequestContext = {
  userId: number | null;
  sessionId: string | null;
};

export function reqCtx(req: RequestWithUser): RequestContext {
  return {
    userId: req.user.id,
    sessionId: req.sessionID,
  };
}