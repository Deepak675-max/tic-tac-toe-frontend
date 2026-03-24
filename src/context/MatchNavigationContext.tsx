import { createContext, useContext, type ReactNode } from 'react';
import type { PublicMatchState } from '../types';

type MatchNavigationValue = {
  enterMatch: (matchId: string, initialState?: PublicMatchState) => void;
};

const MatchNavigationContext = createContext<MatchNavigationValue | null>(
  null,
);

export function MatchNavigationProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MatchNavigationValue;
}) {
  return (
    <MatchNavigationContext.Provider value={value}>
      {children}
    </MatchNavigationContext.Provider>
  );
}

export function useEnterMatch() {
  const ctx = useContext(MatchNavigationContext);
  if (!ctx) {
    throw new Error('useEnterMatch must be used within MatchNavigationProvider');
  }
  return ctx.enterMatch;
}
