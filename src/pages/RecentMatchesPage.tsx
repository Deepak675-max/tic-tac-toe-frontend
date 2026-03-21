import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEnterMatch } from '../context/MatchNavigationContext';
import { listMyMatches } from '../api/matches';
import type { PublicMatchState } from '../types';
import { MatchHistory } from '../components/MatchHistory';

export function RecentMatchesPage() {
  const { player } = useAuth();
  const enterMatch = useEnterMatch();
  const [matches, setMatches] = useState<PublicMatchState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await listMyMatches(50);
      setMatches(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not load your game history.',
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
          <h1 className="page-title">My games</h1>
          <p className="page-lead">
            Your recent matches — open one to jump back in if it’s still active,
            or review how it ended.
          </p>
        </div>
        <button
          type="button"
          className="btn"
          disabled={loading}
          onClick={() => void load()}
        >
          Refresh list
        </button>
      </header>

      {error && <p className="error page-alert">{error}</p>}

      <section className="card page-card">
        <MatchHistory
          matches={matches}
          myPlayerId={player?.id ?? ''}
          loading={loading}
          onOpenMatch={(id, state) => enterMatch(id, state)}
        />
      </section>
    </div>
  );
}
