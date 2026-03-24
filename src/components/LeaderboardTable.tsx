import type { LeaderboardEntry } from '../types';

type Props = {
  rows: LeaderboardEntry[];
  highlightPlayerId?: string | null;
  loading?: boolean;
};

export function LeaderboardTable({
  rows,
  highlightPlayerId,
  loading,
}: Props) {
  if (loading) {
    return <p className="muted">Loading rankings…</p>;
  }

  if (rows.length === 0) {
    return <p className="muted">No players on the board yet — be the first to win a game!</p>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Streak</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.id}
              className={r.id === highlightPlayerId ? 'highlight' : undefined}
            >
              <td className="mono">{i + 1}</td>
              <td>{r.username}</td>
              <td>{r.wins}</td>
              <td>{r.losses}</td>
              <td>{r.winStreak}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
