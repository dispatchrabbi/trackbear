import { traced } from "../../tracer.ts";

import dbClient from "../../db.ts";
import type { Create, Update } from "../types.ts";

import { type RequestContext } from "../../request-context.ts";
import { buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

import type { User } from '../user/user-model.ts';
import { BOARD_STATE, BOARD_PARTICIPANT_STATE } from "./consts.ts";
import { Board, BoardTally, BoardWithParticipantBios, FullBoard, ParticipantBio, ParticipantGoal } from "./types.ts";
import { TALLY_STATE } from "../tally/consts.ts";
import type { Tally } from '../tally/tally-model.wip.ts';
import { omit, pick } from 'server/lib/obj.ts';
import { USER_STATE } from "../user/consts.ts";
import { WORK_STATE } from '../work/consts.ts';
import { TAG_STATE } from '../tag/consts.ts';
import { makeIncludeWorkAndTagIds, included2ids } from '../helpers.ts';

type OptionalBoardFields = 'description' | 'isJoinable' | 'isPublic';
export type CreateBoardData = Create<Board, OptionalBoardFields>;
export type UpdateBoardData = Update<Board>;

export class BoardParticipationModel {

  @traced
  static async getBoardParticipation() {}

  @traced
  static async createBoardParticipation() {}

  @traced
  static async updateBoardParticipation() {}

  @traced
  static async deleteBoardParticipation() {}

}