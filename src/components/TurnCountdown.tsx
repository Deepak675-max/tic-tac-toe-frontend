import { useEffect, useMemo, useRef, useState } from 'react';
import type { PublicMatchState } from '../types';

type Props = {
  state: PublicMatchState;
  myPlayerId: string;
  /** Called when the turn deadline passes while the match is still playing — refetches state (forfeit is resolved on the server on read). */
  onTurnExpired: () => void | Promise<void>;
};

function myPlayerIndex(state: PublicMatchState, id: string): 0 | 1 | null {
  if (state.player1.id === id) return 0;
  if (state.player2?.id === id) return 1;
  return null;
}

export function TurnCountdown({
  state,
  myPlayerId,
  onTurnExpired,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const refreshedForDeadline = useRef<string | null>(null);

  const show =
    state.mode === 'timed' &&
    state.status === 'playing' &&
    Boolean(state.turnDeadline && state.player2);

  useEffect(() => {
    if (state.turnDeadline) {
      setNow(Date.now());
    }
  }, [state.turnDeadline]);

  useEffect(() => {
    if (!show || !state.turnDeadline) return;
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [show, state.turnDeadline]);

  const { secondsLeft, isMyTurn, label, opponentFirstName } = useMemo(() => {
    const me = myPlayerIndex(state, myPlayerId);
    const mine =
      me !== null &&
      state.currentPlayerIndex === me &&
      state.player2 !== null;
    if (!state.turnDeadline) {
      return {
        secondsLeft: 0,
        isMyTurn: mine,
        label: '',
        opponentFirstName: '',
      };
    }
    const end = new Date(state.turnDeadline).getTime();
    const sec = Math.max(0, Math.ceil((end - now) / 1000));
    const opp =
      state.currentPlayerIndex === 0
        ? state.player2?.username ?? 'Opponent'
        : state.player1.username;
    return {
      secondsLeft: sec,
      isMyTurn: mine,
      label: mine ? 'Your turn' : `${opp}’s turn`,
      opponentFirstName: opp,
    };
  }, [state, myPlayerId, now]);

  useEffect(() => {
    refreshedForDeadline.current = null;
  }, [state.turnDeadline]);

  useEffect(() => {
    if (!show || state.status !== 'playing') return;
    if (secondsLeft > 0) return;
    if (!state.turnDeadline) return;
    if (refreshedForDeadline.current === state.turnDeadline) return;
    refreshedForDeadline.current = state.turnDeadline;
    const t = window.setTimeout(() => {
      void onTurnExpired();
    }, 200);
    return () => window.clearTimeout(t);
  }, [show, state.status, state.turnDeadline, secondsLeft, onTurnExpired]);

  if (!show || !state.turnDeadline) {
    return null;
  }

  const totalSec = state.turnSeconds ?? 30;
  const pct = Math.min(100, (secondsLeft / totalSec) * 100);
  const urgent = secondsLeft <= 10 && secondsLeft > 0;
  const expired = secondsLeft <= 0;

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const digits = `${m}:${s.toString().padStart(2, '0')}`;

  return (
    <div
      className={`turn-countdown ${isMyTurn ? 'is-mine' : 'is-theirs'} ${urgent ? 'is-urgent' : ''} ${expired ? 'is-expired' : ''}`}
      role="timer"
      aria-label={
        isMyTurn
          ? `Time left on your turn: ${digits}`
          : `Time left on ${opponentFirstName}’s turn: ${digits}`
      }
    >
      <div className="turn-countdown-top">
        <span className="turn-countdown-label">{label}</span>
        <span className="turn-countdown-digits mono" aria-live="polite">
          {expired ? '0:00' : digits}
        </span>
      </div>
      <div className="turn-countdown-track" aria-hidden>
        <div
          className="turn-countdown-fill"
          style={{ width: `${expired ? 0 : pct}%` }}
        />
      </div>
      <p className="turn-countdown-hint muted small">
        {isMyTurn
          ? `${totalSec}s per move — move before the bar runs out.`
          : 'Waiting for their move…'}
      </p>
    </div>
  );
}
