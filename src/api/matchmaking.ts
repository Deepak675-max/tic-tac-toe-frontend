import type { GameMode, PublicMatchState } from '../types';
import { apiRequest } from './http';

export type QueueResult =
  | { status: 'waiting' }
  | {
      status: 'matched';
      matchId: string;
      state: PublicMatchState;
    };

/** Remove your id from all quick-match lists (call after login / on app load). */
export async function leaveAllQueues(): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>('/matchmaking/queue/leave-all', {
    method: 'POST',
  });
}

/** Poll while in quick-match queue if `queueMatched` socket was missed. */
export async function getActiveQueueMatch(
  mode: GameMode,
  turnSeconds?: number,
): Promise<QueueResult> {
  const q =
    mode === 'timed'
      ? `?mode=${mode}&turnSeconds=${turnSeconds ?? 30}`
      : `?mode=${mode}`;
  return apiRequest<QueueResult>(`/matchmaking/queue/active${q}`, {
    method: 'GET',
  });
}

export async function joinQueue(
  mode: GameMode,
  turnSeconds?: number,
): Promise<QueueResult> {
  return apiRequest<QueueResult>('/matchmaking/queue/join', {
    method: 'POST',
    body: JSON.stringify({
      mode,
      ...(mode === 'timed' ? { turnSeconds: turnSeconds ?? 30 } : {}),
    }),
  });
}

export async function createRoom(
  mode: GameMode,
  turnSeconds?: number,
): Promise<{ roomCode: string; matchId: string }> {
  return apiRequest<{ roomCode: string; matchId: string }>(
    '/matchmaking/rooms',
    {
      method: 'POST',
      body: JSON.stringify({
        mode,
        ...(mode === 'timed' ? { turnSeconds: turnSeconds ?? 30 } : {}),
      }),
    },
  );
}

export async function joinRoomByCode(
  roomCode: string,
): Promise<PublicMatchState> {
  return apiRequest<PublicMatchState>('/matchmaking/rooms/join', {
    method: 'POST',
    body: JSON.stringify({ roomCode: roomCode.trim().toUpperCase() }),
  });
}

export async function listOpenRooms(): Promise<PublicMatchState[]> {
  return apiRequest<PublicMatchState[]>('/matchmaking/rooms', {
    method: 'GET',
  });
}
