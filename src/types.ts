export type MatchStatus = 'waiting' | 'playing' | 'finished' | 'abandoned';

export type GameMode = 'classic' | 'timed';

export interface PublicPlayerRef {
  id: string;
  username: string;
}

export interface PublicMatchState {
  id: string;
  status: MatchStatus;
  mode: GameMode;
  turnSeconds: number | null;
  board: number[];
  currentPlayerIndex: number;
  player1: PublicPlayerRef;
  player2: PublicPlayerRef | null;
  winnerPlayerId: string | null;
  turnDeadline: string | null;
  roomCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  wins: number;
  losses: number;
  winStreak: number;
}

export interface AuthPayload {
  accessToken: string;
  player: PublicPlayerRef;
}
