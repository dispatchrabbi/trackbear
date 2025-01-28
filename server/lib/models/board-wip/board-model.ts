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
// import type { Tally } from '../tally/tally-model.wip.ts';
import { /*omit,*/ pick } from 'server/lib/obj.ts';
import { USER_STATE } from "../user/consts.ts";
// import { WORK_STATE } from '../work/consts.ts';
// import { TAG_STATE } from '../tag/consts.ts';
// import { makeIncludeWorkAndTagIds, included2ids } from '../helpers.ts';

type OptionalBoardFields = 'description' | 'isJoinable' | 'isPublic';
export type CreateBoardData = Create<Board, OptionalBoardFields>;
export type UpdateBoardData = Update<Board>;

export class BoardModel {

  @traced
  static async getBoards(owner: User): Promise<BoardWithParticipantBios[]> {
    const found = await dbClient.board.findMany({
      where: {
        state: BOARD_STATE.ACTIVE,
        OR: [
          { ownerId: owner.id },
          {
            participants: {
              some: {
                userId: owner.id,
                state: BOARD_PARTICIPANT_STATE.ACTIVE
              }
            }
          }
        ]
      },
      include: {
        participants: {
          where: {
            state: BOARD_PARTICIPANT_STATE.ACTIVE,
            user: { is: { state: USER_STATE.ACTIVE } }
          },
          include: {
            user: {
              select: {
                uuid: true,
                displayName: true,
                avatar: true,
              }
            },
          },
        },
      }
    });

    const boards = found.map(board => Object.assign(board, {
      starred: (board.ownerId === owner.id && board.starred) || board.participants.filter(p => p.userId === owner.id).some(p => p.starred),
      participants: board.participants.map(p => p.user) as ParticipantBio[],
    })) as BoardWithParticipantBios[]

    return boards;
  }

  @traced
  static async getFullBoard(owner: User, uuid: string): Promise<FullBoard> {
    const board = await dbClient.board.findUnique({
      where: {
        state: BOARD_STATE.ACTIVE,
        uuid: uuid,
      },
      include: {
        participants: {
          where: {
            state: BOARD_PARTICIPANT_STATE.ACTIVE,
            user: { is: { state: USER_STATE.ACTIVE } }
          },
          include: {
            user: true,
            worksIncluded: { select: { id: true } },
            tagsIncluded: { select: { id: true } },
          },
        },
      }
    });

    if(!board) { return null; }

    // this can be any value that isn't going to be a real measure
    const FAKE_MEASURE_TO_PREVENT_RETURNING_TALLIES_FOR_PARTICIPANTS_WITH_UNSET_GOALS = 'do-not-return-tallies';

    const tallies = await dbClient.tally.findMany({
      where: {
        state: TALLY_STATE.ACTIVE,
        // if there's an overall board goal, only include tallies with the board's measures
        measure: board.individualGoalMode ? undefined : { in: board.measures },
        // only include tallies within the time range (if one exists)
        date: {
          gte: board.startDate || undefined,
          lte: board.endDate || undefined,
        },
        // forgive me for what I do here
        OR: board.participants.map(participant => ({
          // the tally should be owned by the participant
          ownerId: participant.userId,
          // only include tallies with the measure from the individual goal, if there are individual goals — but don't return any tallies if the participant hasn't set a goal
          measure: board.individualGoalMode ? ((participant.goal as ParticipantGoal)?.measure ?? FAKE_MEASURE_TO_PREVENT_RETURNING_TALLIES_FOR_PARTICIPANTS_WITH_UNSET_GOALS) : undefined,
          // only include tallies from works specified in the participant's config (if any were)
          workId: participant.worksIncluded.length > 0 ? { in: participant.worksIncluded.map(work => work.id ) } : undefined,
          // only include tallies with at least one tag specified in the participant's config (if any were)
          tags: participant.tagsIncluded.length > 0 ? { some: { id: { in: participant.tagsIncluded.map(tag => tag.id ) } } } : undefined,
        }))
      }
    });

    const fullBoard = Object.assign(board, {
      participants: board.participants.map(participant => ({
        ...(pick(participant.user, ['uuid', 'displayName', 'avatar']) as ParticipantBio),
        goal: participant.goal as ParticipantGoal,
        tallies: tallies.filter(tally => tally.ownerId === participant.userId).map(tally => ({
          uuid: tally.uuid,
          date: tally.date,
          count: tally.count,
          measure: tally.measure,
        })) as BoardTally[],
      })),
    }) as FullBoard;

    return fullBoard;
  }

  @traced
  static async createBoard(owner: User, data: CreateBoardData, reqCtx: RequestContext): Promise<Board> {
    const dataWithDefaults: Required<CreateBoardData> = Object.assign({
      description: '',
      starred: false,
      isJoinable: false,
      isPublic: false,
    }, data);

    const normalizedData = this.normalizeBoardData(dataWithDefaults);
    
    const created = await dbClient.board.create({
      data: {
        state: BOARD_STATE.ACTIVE,
        ownerId: owner.id,

        ...normalizedData,
      }
    }) as Board;

    const changes = buildChangeRecord({}, created);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.BOARD_CREATE,
      reqCtx.userId, created.id, null,
      changes, reqCtx.sessionId
    );

    return created;
  }

  @traced
  static async updateBoard(owner: User, board: Board, data: UpdateBoardData, reqCtx: RequestContext): Promise<Board> {
    const normalizedData = this.normalizeBoardData(data);

    const updated = await dbClient.board.update({
      where: {
        id: board.id,
        ownerId: owner.id,
        state: BOARD_STATE.ACTIVE,
      },
      data: {
        ...normalizedData,
      },
    }) as Board;

    const changes = buildChangeRecord(board, updated);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.BOARD_UPDATE,
      reqCtx.userId, updated.id, null,
      changes, reqCtx.sessionId
    );

    return updated;
  }

  @traced
  static async deleteBoard(owner: User, board: Board, reqCtx: RequestContext): Promise<Board> {
    // when deleting a board, we set the status to deleted
    // that makes it easy to un-delete a board if a user asks us to
    const deleted = await dbClient.board.update({
      data: {
        state: BOARD_STATE.DELETED,
      },
      where: {
        id: board.id,
        ownerId: owner.id,
        state: BOARD_STATE.ACTIVE,
      }
    }) as Board;

    const changes = buildChangeRecord(board, deleted);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.BOARD_DELETE,
      reqCtx.userId, board.id, null,
      changes, reqCtx.sessionId
    );

    return deleted;
  }

  @traced
  static async undeleteBoard(owner: User, board: Board, reqCtx: RequestContext): Promise<Board> {
    const undeleted = await dbClient.board.update({
      data: {
        state: BOARD_STATE.ACTIVE,
      },
      where: {
        id: board.id,
        ownerId: owner.id,
        state: BOARD_STATE.DELETED,
      }
    }) as Board;

    const changes = buildChangeRecord(board, undeleted);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.BOARD_UNDELETE,
      reqCtx.userId, board.id, null,
      changes, reqCtx.sessionId
    );

    return undeleted;
  }

  private static normalizeBoardData<T extends Required<CreateBoardData> | UpdateBoardData>(data: T): T {
    // if the board is in individual goal mode, it can have no goals or measures, and fundraiser mode is impossible
    if(data.individualGoalMode) {
      data.goal = {};
      data.measures = [];
      data.fundraiserMode = false;
    }

    return data;
  }

}