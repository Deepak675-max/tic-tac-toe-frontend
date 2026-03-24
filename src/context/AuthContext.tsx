import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthPayload, PublicPlayerRef } from '../types';
import * as authApi from '../api/auth';
import * as mm from '../api/matchmaking';

const STORAGE_KEY = 'token';
const PLAYER_KEY = 'player';

type AuthContextValue = {
  token: string | null;
  player: PublicPlayerRef | null;
  login: (username: string) => Promise<void>;
  register: (username: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredPlayer(): PublicPlayerRef | null {
  try {
    const raw = localStorage.getItem(PLAYER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PublicPlayerRef;
  } catch {
    return null;
  }
}

function writeSessionToStorage(payload: AuthPayload) {
  localStorage.setItem(STORAGE_KEY, payload.accessToken);
  localStorage.setItem(PLAYER_KEY, JSON.stringify(payload.player));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );
  const [player, setPlayer] = useState<PublicPlayerRef | null>(loadStoredPlayer);

  const login = useCallback(async (username: string) => {
    const data = await authApi.login(username);
    writeSessionToStorage(data);
    await mm.leaveAllQueues().catch(() => {
      /* offline — session still valid */
    });
    setToken(data.accessToken);
    setPlayer(data.player);
  }, []);

  const register = useCallback(async (username: string) => {
    const data = await authApi.register(username);
    writeSessionToStorage(data);
    await mm.leaveAllQueues().catch(() => {
      /* offline — session still valid */
    });
    setToken(data.accessToken);
    setPlayer(data.player);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PLAYER_KEY);
    setToken(null);
    setPlayer(null);
  }, []);

  const value = useMemo(
    () => ({ token, player, login, register, logout }),
    [token, player, login, register, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
