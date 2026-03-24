import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchLeaderboard } from '../api/leaderboard';
import type { LeaderboardEntry } from '../types';
import { LeaderboardTable } from '../components/LeaderboardTable';

export function LeaderboardPage() {
  const { player } = useAuth();
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchLeaderboard(50);
      setRows(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not load the leaderboard.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page">
      <header className="page-header page-header-row">
        <div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-lead">
            See who’s winning the most games. Rankings use wins, then current
            win streak.
          </p>
        </div>
        <button
          type="button"
          className="btn"
          disabled={loading}
          onClick={() => void load()}
        >
          Refresh rankings
        </button>
      </header>

      {error && <p className="error page-alert">{error}</p>}

      <section className="card page-card">
        <LeaderboardTable
          rows={rows}
          highlightPlayerId={player?.id}
          loading={loading}
        />
      </section>
    </div>
  );
}
