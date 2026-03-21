import { Link } from 'react-router-dom';
import type { PublicMatchState } from '../types';

function statusLabel(s: PublicMatchState['status']): string {
  switch (s) {
    case 'waiting':
      return 'Waiting';
    case 'playing':
      return 'Playing';
    case 'finished':
      return 'Finished';
    case 'abandoned':
      return 'Abandoned';
    default:
      return s;
  }
}

function outcomeLabel(m: PublicMatchState, myId: string): string {
  if (m.status === 'waiting') {
    return 'Lobby';
  }
  if (m.status === 'playing') {
    return '—';
  }
  if (m.status === 'abandoned') {
    return '—';
  }
  if (m.status === 'finished') {
    if (m.winnerPlayerId === null) {
      return 'Draw';
    }
    return m.winnerPlayerId === myId ? 'Win' : 'Loss';
  }
  return '—';
}

function opponentName(m: PublicMatchState, myId: string): string {
  if (m.player1.id === myId) {
    return m.player2?.username ?? '—';
  }
  return m.player1.username;
}

function modeFriendly(m: PublicMatchState): string {
  return m.mode === 'timed' ? 'Beat the clock' : 'Relaxed';
}

type Props = {
  matches: PublicMatchState[];
  myPlayerId: string;
  loading?: boolean;
  onOpenMatch?: (matchId: string, state: PublicMatchState) => void;
};

export function MatchHistory({
  matches,
  myPlayerId,
  loading,
  onOpenMatch,
}: Props) {
  if (loading) {
    return <p className="muted">Loading your games…</p>;
  }

  if (matches.length === 0) {
    return (
      <p className="muted">
        You haven’t played a game yet. Go to{' '}
        <Link to="/" className="inline-link">
          Play
        </Link>{' '}
        to find an opponent or invite a friend.
      </p>
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Style</th>
            <th>Status</th>
            <th>Opponent</th>
            <th>Your result</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.id}>
              <td className="mono nowrap">
                {new Date(m.updatedAt).toLocaleString(undefined, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </td>
              <td>{modeFriendly(m)}</td>
              <td>
                <span className={`badge status-${m.status}`}>
                  {statusLabel(m.status)}
                </span>
              </td>
              <td>{opponentName(m, myPlayerId)}</td>
              <td>{outcomeLabel(m, myPlayerId)}</td>
              <td>
                {onOpenMatch && (
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => onOpenMatch(m.id, m)}
                  >
                    Open game
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
