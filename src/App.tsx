import { useCallback, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MatchNavigationProvider } from './context/MatchNavigationContext';
import { AppLayout } from './layouts/AppLayout';
import { AuthPanel } from './components/AuthPanel';
import { GameRoom } from './components/GameRoom';
import { HelpPage } from './pages/HelpPage';
import { HomePage } from './pages/HomePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { RecentMatchesPage } from './pages/RecentMatchesPage';
import type { PublicMatchState } from './types';
import './App.css';

function AppShell() {
  const { token } = useAuth();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [initialState, setInitialState] = useState<
    PublicMatchState | undefined
  >(undefined);

  const enterMatch = useCallback(
    (id: string, state?: PublicMatchState) => {
      setMatchId(id);
      setInitialState(state);
    },
    [],
  );

  const onLeave = useCallback(() => {
    setMatchId(null);
    setInitialState(undefined);
  }, []);

  if (!token) {
    return <AuthPanel />;
  }

  if (matchId) {
    return (
      <GameRoom
        matchId={matchId}
        initialState={initialState}
        onLeave={onLeave}
      />
    );
  }

  return (
    <MatchNavigationProvider value={{ enterMatch }}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="games" element={<RecentMatchesPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MatchNavigationProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
