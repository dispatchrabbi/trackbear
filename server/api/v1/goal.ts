import { Router } from "express";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';

import { requireUser, RequestWithUser } from '../../lib/auth.ts';

import { z } from 'zod';
import { zIdParam, NonEmptyArray } from '../../lib/validators.ts';
import { validateBody, validateParams } from "../../lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { Goal, Work, Tally, Tag } from "@prisma/client";
import { GOAL_STATE, GOAL_TYPE } from "server/lib/entities/goal.ts";
import { WORK_STATE } from '../../lib/entities/work.ts';
import { TALLY_STATE } from "../../lib/entities/tally.ts";
import { TAG_STATE } from "../../lib/entities/tag.ts";

import { logAuditEvent } from '../../lib/audit-events.ts';

import { omit } from '../../lib/obj.ts';

export type GoalWithSummary = Goal & Record<string, never>;

const goalRouter = Router();
export default goalRouter;
