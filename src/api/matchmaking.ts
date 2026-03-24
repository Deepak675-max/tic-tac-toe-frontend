import type { GameMode, PublicMatchState } from '../types';
import { apiRequest } from './http';

/** Remove your id from all quick-match lists (call after login / on app load). */
export async function leaveAllQueues(): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>('/matchmaking/queue/leave-all', {
    method: 'POST',
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
