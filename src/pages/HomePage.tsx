import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_BASE } from '../config';
import type { GameMode, PublicMatchState } from '../types';
import { useAuth } from '../context/AuthContext';
import { useEnterMatch } from '../context/MatchNavigationContext';
import * as mm from '../api/matchmaking';

const QUEUE_MATCHED_EVENT = 'queueMatched';

const MODE_COPY: Record<GameMode, { title: string; blurb: string }> = {
  classic: {
    title: 'Relaxed',
    blurb: 'No timer — play at your own pace.',
  },
  timed: {
    title: 'Beat the clock',
    blurb: '30 seconds per move or you forfeit the game.',
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

function IconCross() {
  return (
    <svg className="home-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M7 7l10 10M17 7L7 17"
      />
    </svg>
  );
}

function IconCircle() {
  return (
    <svg className="home-icon" viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg className="home-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M11 21h2l1-7h6l-8-12v9H9l2 10z"
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="home-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
      />
    </svg>
  );
}

function IconKeypad() {
  return (
    <svg className="home-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M4 17h16v2H4v-2zm0-12h16v2H4V5zm2 4h2.5v2H6V9zm4.25 0h2.5v2h-2.5V9zm4.25 0H17v2h-2.5V9z"
      />
    </svg>
  );
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

    const payload =
      queueMode === 'timed'
        ? { mode: queueMode, turnSeconds: 30 as const }
        : { mode: queueMode };

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

    type QueueAck =
      | { status: 'waiting' }
      | { status: 'matched'; matchId: string; state: PublicMatchState };

    const onJoinAck = (ack: QueueAck | undefined) => {
      if (!ack || finishedRef.current || cancelled.current) return;
      if (ack.status === 'matched') {
        if (!isParticipant(ack.state, myId)) return;
        finish(ack.matchId, ack.state);
      }
    };

    /** On connect / reconnect: sync server queue state; join only if not already waiting. */
    const onConnect = () => {
      if (finishedRef.current || cancelled.current) return;
      socket.emit('syncQueue', payload, (ack: QueueAck | undefined) => {
        if (finishedRef.current || cancelled.current) return;
        if (ack?.status === 'matched') {
          if (!isParticipant(ack.state, myId)) return;
          finish(ack.matchId, ack.state);
          return;
        }
        if (ack?.status === 'waiting') {
          return;
        }
        socket.emit('joinQueue', payload, onJoinAck);
      });
    };

    socket.on('connect', onConnect);

    socket.on(
      QUEUE_MATCHED_EVENT,
      (ev: { matchId: string; state: PublicMatchState }) => {
        if (!isParticipant(ev.state, myId)) return;
        finish(ev.matchId, ev.state);
      },
    );

    socket.on('connect_error', (err: Error) => {
      if (cancelled.current) return;
      setError(
        err.message ?? 'Could not connect. Check that the game server is running.',
      );
      setQueueMode(null);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off(QUEUE_MATCHED_EVENT);
      socket.off('connect_error');
      const s = socket;
      if (s.connected) {
        s.emit('leaveQueue', payload, () => {
          queueMicrotask(() => s.disconnect());
        });
        window.setTimeout(() => {
          s.disconnect();
        }, 2500);
      } else {
        queueMicrotask(() => s.disconnect());
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

  const matchmakingLocked = busy || !player;
  const secondaryLocked = busy || queueMode !== null;

  return (
    <div className="page home-page">
      <div className="home-hero" aria-hidden>
        <div className="home-hero-glow" />
        <div className="home-hero-board">
          <span />
          <span />
          <span />
          <span />
          <span className="home-hero-board-mid" />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <header className="home-header">
        <p className="home-eyebrow">Online lobby</p>
        <h1 className="home-title">Play tic-tac-toe</h1>
        <p className="home-lead">
          Queue for a random match, host a private room, or join a friend with a
          code — same rules, your choice of pace.
        </p>
      </header>

      {error && (
        <div className="home-error" role="alert">
          <p className="home-error-text">{error}</p>
          <button
            type="button"
            className="home-error-dismiss"
            aria-label="Dismiss message"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="home-layout">
        <section className="home-panel home-panel--primary">
          <div className="home-panel-head">
            <div className="home-panel-icon home-panel-icon--match">
              <IconCross />
              <IconCircle />
            </div>
            <div>
              <h2 className="home-panel-title">Quick match</h2>
              <p className="home-panel-sub">
                Get paired with the next player in queue for your mode.
              </p>
            </div>
          </div>

          {queueMode ? (
            <div className="home-queue">
              <div className="home-queue-visual" aria-hidden>
                <span className="home-queue-ring" />
                <span className="home-queue-dot" />
              </div>
              <div className="home-queue-copy">
                <p className="home-queue-title">Finding an opponent…</p>
                <p className="home-queue-meta">
                  {MODE_COPY[queueMode].title} · {MODE_COPY[queueMode].blurb}
                </p>
              </div>
              <button
                type="button"
                className="btn home-queue-cancel"
                onClick={stopQueue}
              >
                Cancel search
              </button>
            </div>
          ) : (
            <div className="home-mode-picks">
              <article className="home-mode-card">
                <div className="home-mode-card-top">
                  <span className="home-badge">Casual</span>
                  <p className="home-mode-desc">No turn timer — take your time.</p>
                </div>
                <button
                  type="button"
                  className="btn primary btn-block home-mode-cta"
                  disabled={matchmakingLocked}
                  onClick={() => setQueueMode('classic')}
                >
                  Find match
                </button>
              </article>
              <article className="home-mode-card home-mode-card--timed">
                <div className="home-mode-card-top">
                  <span className="home-badge home-badge--timed">
                    <IconBolt />
                    Timed
                  </span>
                  <p className="home-mode-desc">
                    30 seconds per move — fast games.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-block home-mode-cta home-mode-cta--outline"
                  disabled={matchmakingLocked}
                  onClick={() => setQueueMode('timed')}
                >
                  Find timed match
                </button>
              </article>
            </div>
          )}
        </section>

        <section className="home-panel home-panel--friend">
          <div className="home-panel-head">
            <div className="home-panel-icon home-panel-icon--solo">
              <IconUsers />
            </div>
            <div>
              <h2 className="home-panel-title">Play with a friend</h2>
              <p className="home-panel-sub">
                Create a room, share the code from the next screen, and start
                when they join.
              </p>
            </div>
          </div>
          <div className="home-friend-actions">
            <button
              type="button"
              className="btn primary btn-block home-friend-btn"
              disabled={secondaryLocked}
              onClick={() => void handleCreateRoom('classic')}
            >
              <span className="home-friend-btn-label">New casual room</span>
              <span className="home-friend-btn-hint">No timer</span>
            </button>
            <button
              type="button"
              className="btn btn-block home-friend-btn home-friend-btn--secondary"
              disabled={secondaryLocked}
              onClick={() => void handleCreateRoom('timed')}
            >
              <span className="home-friend-btn-label">New timed room</span>
              <span className="home-friend-btn-hint">30s / move</span>
            </button>
          </div>
        </section>

        <section className="home-panel home-panel--join">
          <div className="home-panel-head">
            <div className="home-panel-icon home-panel-icon--join">
              <IconKeypad />
            </div>
            <div>
              <h2 className="home-panel-title">Have a code?</h2>
              <p className="home-panel-sub">
                Enter what your friend sent — usually 4–8 letters or numbers.
              </p>
            </div>
          </div>
          <div className="home-join-row">
            <label className="home-code-field">
              <span className="sr-only">Room code</span>
              <input
                className="home-code-input"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                maxLength={8}
                autoComplete="off"
                spellCheck={false}
                aria-label="Room code"
              />
            </label>
            <button
              type="button"
              className="btn primary home-join-btn"
              disabled={secondaryLocked}
              onClick={() => void handleJoinRoom()}
            >
              Join
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
