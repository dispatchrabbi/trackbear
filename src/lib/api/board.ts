import { callApiV1 } from "./api.ts";

import type { BoardParticipant } from "@prisma/client";
import type { Board, FullBoard } from "server/lib/models/board.ts";
import type { BoardCreatePayload, BoardUpdatePayload, BoardParticipantPayload } from "server/api/v1/board.ts";

export type { Board, FullBoard, BoardParticipant, BoardCreatePayload, BoardUpdatePayload, BoardParticipantPayload };

const ENDPOINT = '/api/v1/board';

export async function getBoards() {
  return callApiV1<Board[]>(ENDPOINT, 'GET');
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
  return callApiV1<Board>(ENDPOINT + `/${uuid}`, 'PATCH', { starred });
}

export async function deleteBoard(uuid: string) {
  return callApiV1<Board>(ENDPOINT + `/${uuid}`, 'DELETE');
}

export async function joinBoard(uuid: string, data: BoardParticipantPayload) {
  return callApiV1<BoardParticipant>(ENDPOINT + `/${uuid}/participation`, 'POST', data);
}

export async function leaveBoard(uuid: string) {
  return callApiV1<BoardParticipant>(ENDPOINT + `/${uuid}/participation`, 'DELETE');
}
