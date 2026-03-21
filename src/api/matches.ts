import type { PublicMatchState } from '../types';
import { apiRequest } from './http';

export async function getMatch(matchId: string): Promise<PublicMatchState> {
  return apiRequest<PublicMatchState>(`/matches/${matchId}`, {
    method: 'GET',
  });
}

export async function listMyMatches(limit = 50): Promise<PublicMatchState[]> {
  const q = new URLSearchParams({ limit: String(limit) });
  return apiRequest<PublicMatchState[]>(`/matches?${q}`, {
    method: 'GET',
  });
}
