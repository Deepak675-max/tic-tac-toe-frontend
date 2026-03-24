import type { LeaderboardEntry } from '../types';
import { apiRequest } from './http';

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const q = new URLSearchParams({ limit: String(limit) });
  return apiRequest<LeaderboardEntry[]>(`/leaderboard?${q}`, {
    method: 'GET',
  });
}
