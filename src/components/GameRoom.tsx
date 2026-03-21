import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_BASE } from '../config';
import type { PublicMatchState } from '../types';
import { useAuth } from '../context/AuthContext';
import * as matchesApi from '../api/matches';
import { GameBoard } from './GameBoard';

const WS_MOVE_ERROR = 'moveError';

type GameRoomProps = {
  matchId: string;
  initialState?: PublicMatchState;
  onLeave: () => void;
};

export function GameRoom({ matchId, initialState, onLeave }: GameRoomProps) {
  const { token, player } = useAuth();
  const [state, setState] = useState<PublicMatchState | null>(
    initialState ?? null,
  );
  const [socketError, setSocketError] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const loadRest = useCallback(async () => {
    try {
      const s = await matchesApi.getMatch(matchId);
      setState(s);
    } catch {
      setSocketError('Could not load match');
    }
  }, [matchId]);

  useEffect(() => {
    if (!token || !player) return;

    const socket = io(`${SOCKET_BASE}/game`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketError(null);
      socket.emit(
        'joinMatch',
        { matchId },
        (ack: { event?: string; state?: PublicMatchState } | undefined) => {
          if (ack?.state) {
            setState(ack.state);
          } else if (!initialState) {
            void loadRest();
          }
        },
      );
    });

    socket.on('connect_error', (err) => {
      setSocketError(err.message || 'Socket connection failed');
    });

    socket.on('state', (next: PublicMatchState) => {
      setState(next);
    });

    socket.on(
      WS_MOVE_ERROR,
      (payload: { message?: string; code?: string }) => {
        setMoveError(payload.message ?? payload.code ?? 'Invalid move');
      },
    );

    if (!initialState) {
      void loadRest();
    }

    return () => {
      socket.emit('leaveMatch', { matchId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, player, matchId, initialState, loadRest]);

  function sendMove(row: number, col: number) {
    const s = socketRef.current;
    if (!s?.connected) return;
    setMoveError(null);
    setBusy(true);
    s.emit(
      'move',
      { matchId, row, col },
      (
        ack:
          | { status: 'ok'; state: PublicMatchState }
          | { status: 'error'; message: string; code?: string }
          | undefined,
      ) => {
        setBusy(false);
        if (!ack) return;
        if (ack.status === 'ok' && ack.state) {
          setState(ack.state);
        }
        if (ack.status === 'error') {
          setMoveError(ack.message);
        }
      },
    );
  }

  if (!player) {
    return null;
  }

  const modeLabel =
    state?.mode === 'timed' ? 'Beat the clock' : 'Relaxed';

  return (
    <section className="panel game-room">
      <header className="game-header">
        <div>
          <h1>Your game</h1>
          {state && (
            <p className="muted small">
              {modeLabel}
              <span className="mono game-id" title="Match id">
                {' · '}
                {matchId.slice(0, 8)}…
              </span>
            </p>
          )}
          {!state && <p className="muted small mono">{matchId}</p>}
        </div>
        <button type="button" className="btn ghost" onClick={onLeave}>
          Back to menu
        </button>
      </header>

      {socketError && <p className="error">{socketError}</p>}
      {moveError && (
        <p className="error banner" role="alert">
          {moveError}
          <button
            type="button"
            className="dismiss"
            onClick={() => setMoveError(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </p>
      )}

      {state && (
        <>
          <div className="match-meta">
            <div>
              <span className="label">Style</span>
              <span>{modeLabel}</span>
            </div>
            {state.roomCode && (
              <div>
                <span className="label">Friend code</span>
                <span className="mono room-code">{state.roomCode}</span>
              </div>
            )}
            <div className="players">
              <span>
                ✕{' '}
                <strong>{state.player1.username}</strong>
              </span>
              <span>
                ○{' '}
                <strong>
                  {state.player2?.username ?? '…'}
                </strong>
              </span>
            </div>
          </div>

          <GameBoard
            state={state}
            myPlayerId={player.id}
            onCellClick={sendMove}
            disabled={busy}
            onTurnExpired={loadRest}
          />
        </>
      )}

      {!state && !socketError && (
        <p className="muted">Setting up your board…</p>
      )}
    </section>
  );
}
