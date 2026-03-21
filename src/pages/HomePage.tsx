import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_BASE } from '../config';
import type { GameMode, PublicMatchState } from '../types';
import { useAuth } from '../context/AuthContext';
import { useEnterMatch } from '../context/MatchNavigationContext';
import * as mm from '../api/matchmaking';

const QUEUE_MATCHED_EVENT = 'queueMatched';

const MODE_COPY: Record<
  GameMode,
  { title: string; blurb: string; queueBtn: string; hostBtn: string }
> = {
  classic: {
    title: 'Relaxed',
    blurb: 'No timer — play at your own pace.',
    queueBtn: 'Find a random opponent (relaxed)',
    hostBtn: 'Create a friend room (relaxed)',
  },
  timed: {
    title: 'Beat the clock',
    blurb: '30 seconds per move or you forfeit the game.',
    queueBtn: 'Find a random opponent (timed)',
    hostBtn: 'Create a friend room (timed)',
  },
};

function isParticipant(
  state: PublicMatchState | undefined,
  playerId: string,
): boolean {
  if (!state) return true;
  const p = playerId.toLowerCase();
  if (state.player1.id.toLowerCase() === p) return true;
  if (state.player2?.id.toLowerCase() === p) return true;
  return false;
}

export function HomePage() {
  const { token, player } = useAuth();
  const enterMatch = useEnterMatch();
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [queueMode, setQueueMode] = useState<GameMode | null>(null);
  const cancelled = useRef(false);
  const finishedRef = useRef(false);

  const stopQueue = useCallback(() => {
    cancelled.current = true;
    setQueueMode(null);
  }, []);

  useEffect(() => {
    if (!queueMode || !token || !player) return;
    cancelled.current = false;
    finishedRef.current = false;
    const myId = player.id;

    const socket = io(`${SOCKET_BASE}/game`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    const finish = (matchId: string, state?: PublicMatchState) => {
      if (finishedRef.current || cancelled.current) return;
      if (state && !isParticipant(state, myId)) return;
      finishedRef.current = true;
      enterMatch(matchId, state);
      setQueueMode(null);
    };

    const runJoinQueue = () => {
      socket.emit(
        'joinQueue',
        {
          mode: queueMode,
          ...(queueMode === 'timed' ? { turnSeconds: 30 } : {}),
        },
        (
          ack:
            | { status: 'waiting' }
            | {
                status: 'matched';
                matchId: string;
                state: PublicMatchState;
              }
            | undefined,
        ) => {
          if (!ack || finishedRef.current || cancelled.current) return;
          if (ack.status === 'matched') {
            if (!isParticipant(ack.state, myId)) return;
            finish(ack.matchId, ack.state);
          }
        },
      );
    };

    socket.on('connect', runJoinQueue);

    socket.on(
      QUEUE_MATCHED_EVENT,
      (payload: { matchId: string; state: PublicMatchState }) => {
        if (!isParticipant(payload.state, myId)) return;
        finish(payload.matchId, payload.state);
      },
    );

    socket.on('connect_error', (err: Error) => {
      if (cancelled.current) return;
      setError(
        err.message ?? 'Could not connect. Check that the game server is running.',
      );
      setQueueMode(null);
    });

    const pollOnce = async () => {
      if (finishedRef.current || cancelled.current) return;
      try {
        const r = await mm.getActiveQueueMatch(
          queueMode,
          queueMode === 'timed' ? 30 : undefined,
        );
        if (finishedRef.current || cancelled.current) return;
        if (r.status === 'matched') {
          if (!isParticipant(r.state, myId)) return;
          finish(r.matchId, r.state);
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('[quick match poll]', e);
        }
      }
    };

    void pollOnce();
    const pollMs = 1000;
    const pollId = window.setInterval(() => void pollOnce(), pollMs);

    return () => {
      window.clearInterval(pollId);
      const body =
        queueMode === 'timed'
          ? { mode: queueMode, turnSeconds: 30 as const }
          : { mode: queueMode };
      if (socket.connected) {
        socket.emit('leaveQueue', body, () => {
          socket.disconnect();
        });
        window.setTimeout(() => {
          socket.disconnect();
        }, 2500);
      } else {
        socket.disconnect();
      }
    };
  }, [queueMode, token, player, enterMatch]);

  async function handleCreateRoom(mode: GameMode) {
    setError(null);
    setBusy(true);
    try {
      const { matchId } = await mm.createRoom(
        mode,
        mode === 'timed' ? 30 : undefined,
      );
      enterMatch(matchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create a room');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinRoom() {
    setError(null);
    const code = roomCodeInput.trim();
    if (code.length < 4) {
      setError('Please enter the room code your friend shared with you.');
      return;
    }
    setBusy(true);
    try {
      const state = await mm.joinRoomByCode(code);
      enterMatch(state.id, state);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not join that room. Check the code.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Play</h1>
        <p className="page-lead">
          Choose how you want to play — we’ll connect you when your opponent is
          ready.
        </p>
      </header>

      {error && <p className="error page-alert">{error}</p>}

      <div className="play-grid">
        <section className="card play-card">
          <h2 className="card-title">Quick match</h2>
          <p className="card-desc">
            Get paired with the next available player. You’ll jump into the game
            as soon as someone else queues with the same style.
          </p>
          {queueMode ? (
            <div className="queue-status">
              <div>
                <p className="queue-title">Looking for an opponent…</p>
                <p className="muted small">
                  {MODE_COPY[queueMode].title} — {MODE_COPY[queueMode].blurb}
                </p>
              </div>
              <button type="button" className="btn" onClick={stopQueue}>
                Stop searching
              </button>
            </div>
          ) : (
            <div className="stack-btns">
              <button
                type="button"
                className="btn primary btn-block"
                disabled={busy || !player}
                onClick={() => setQueueMode('classic')}
              >
                {MODE_COPY.classic.queueBtn}
              </button>
              <button
                type="button"
                className="btn btn-block"
                disabled={busy || !player}
                onClick={() => setQueueMode('timed')}
              >
                {MODE_COPY.timed.queueBtn}
              </button>
            </div>
          )}
        </section>

        <section className="card play-card">
          <h2 className="card-title">Play with a friend</h2>
          <p className="card-desc">
            Create a private room and share the code. Your friend enters the same
            code to join you.
          </p>
          <div className="stack-btns">
            <button
              type="button"
              className="btn primary btn-block"
              disabled={busy}
              onClick={() => void handleCreateRoom('classic')}
            >
              {MODE_COPY.classic.hostBtn}
            </button>
            <button
              type="button"
              className="btn btn-block"
              disabled={busy}
              onClick={() => void handleCreateRoom('timed')}
            >
              {MODE_COPY.timed.hostBtn}
            </button>
          </div>
        </section>

        <section className="card play-card play-card-wide">
          <h2 className="card-title">Join a friend’s room</h2>
          <p className="card-desc">
            Enter the room code they sent you (letters and numbers).
          </p>
          <div className="join-row">
            <label className="field field-inline">
              <span className="sr-only">Room code</span>
              <input
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={8}
                aria-label="Room code"
              />
            </label>
            <button
              type="button"
              className="btn primary"
              disabled={busy}
              onClick={() => void handleJoinRoom()}
            >
              Join this room
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
