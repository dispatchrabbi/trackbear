import { callApiV1 } from "./api.ts";

import type { BoardParticipant } from "@prisma/client";
import type { Board, BoardWithParticipantBios, FullBoard, BoardGoal, BoardWithParticipants, ExtendedBoardParticipant } from "server/lib/models/board-wip/types.ts";
import type { BoardCreatePayload, BoardUpdatePayload, BoardStarUpdatePayload, BoardStarUpdateResponse, BoardParticipantPayload } from "server/api/v1/board.ts";

export type {
  Board, BoardWithParticipantBios, FullBoard, BoardWithParticipants, BoardGoal, BoardParticipant, ExtendedBoardParticipant,
  BoardCreatePayload, BoardUpdatePayload, BoardParticipantPayload, BoardStarUpdatePayload, BoardStarUpdateResponse,
};

const ENDPOINT = '/api/v1/board';

export async function getBoards() {
  return callApiV1<BoardWithParticipantBios[]>(ENDPOINT, 'GET');
}

export async function getBoard(uuid: string) {
  return callApiV1<FullBoard>(ENDPOINT + `/${uuid}`, 'GET');
}

export async function createBoard(data: BoardCreatePayload) {
  return callApiV1<Board>(ENDPOINT, 'POST', data);
}

export async function updateBoard(uuid: string, data: BoardUpdatePayload) {
  return callApiV1<Board>(ENDPOINT + `/${uuid}`, 'PATCH', data);
}

export async function starBoard(uuid: string, starred: boolean) {
  const data: BoardStarUpdatePayload = { starred };
  return callApiV1<BoardStarUpdateResponse>(ENDPOINT + `/${uuid}/star`, 'PATCH', data);
}

export async function deleteBoard(uuid: string) {
  return callApiV1<Board>(ENDPOINT + `/${uuid}`, 'DELETE');
}

export async function getBoardParticipation(uuid: string) {
  return callApiV1<BoardWithParticipants>(ENDPOINT + `/${uuid}/participation`, 'GET');
}

export async function joinBoard(uuid: string, data: BoardParticipantPayload) {
  return callApiV1<BoardParticipant>(ENDPOINT + `/${uuid}/participation`, 'POST', data);
}

export async function leaveBoard(uuid: string) {
  return callApiV1<BoardParticipant>(ENDPOINT + `/${uuid}/participation`, 'DELETE');
}
