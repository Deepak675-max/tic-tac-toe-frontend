import type { PublicMatchState } from '../types';
import { TurnCountdown } from './TurnCountdown';

const CELL_LABEL: Record<number, string> = {
  0: '',
  1: '✕',
  2: '○',
};

type GameBoardProps = {
  state: PublicMatchState;
  myPlayerId: string;
  onCellClick: (row: number, col: number) => void;
  disabled?: boolean;
  onTurnExpired: () => void | Promise<void>;
};

function playerIndex(state: PublicMatchState, myId: string): 0 | 1 | null {
  if (state.player1.id === myId) return 0;
  if (state.player2?.id === myId) return 1;
  return null;
}

export function GameBoard({
  state,
  myPlayerId,
  onCellClick,
  disabled,
  onTurnExpired,
}: GameBoardProps) {
  const me = playerIndex(state, myPlayerId);
  const isMyTurn =
    state.status === 'playing' &&
    me !== null &&
    state.currentPlayerIndex === me &&
    state.player2 !== null;

  return (
    <div className="board-wrap">
      <TurnCountdown
        state={state}
        myPlayerId={myPlayerId}
        onTurnExpired={onTurnExpired}
      />
      <div
        className={`board ${state.status !== 'playing' || !state.player2 ? 'inactive' : ''}`}
        role="grid"
        aria-label="Tic-tac-toe board"
      >
        {Array.from({ length: 9 }, (_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const v = state.board[i] ?? 0;
          const empty = v === 0;
          const canClick =
            !disabled &&
            isMyTurn &&
            empty &&
            state.status === 'playing';

          return (
            <button
              key={i}
              type="button"
              className={`cell ${v === 1 ? 'x' : v === 2 ? 'o' : ''}`}
              disabled={!canClick}
              onClick={() => onCellClick(row, col)}
              aria-label={
                empty
                  ? `Empty cell row ${row + 1} column ${col + 1}`
                  : `Cell ${CELL_LABEL[v]}`
              }
            >
              {CELL_LABEL[v]}
            </button>
          );
        })}
      </div>
      <p className="muted turn-hint">
        {state.status === 'waiting' && (
          <>
            Waiting for your friend to join — send them the room code if you
            haven’t already.
          </>
        )}
        {state.status === 'playing' && state.player2 && me !== null && (
          <>
            {isMyTurn ? (
              <strong>Your turn — tap a square</strong>
            ) : (
              <>Sit tight — it’s your opponent’s turn.</>
            )}
          </>
        )}
        {state.status === 'finished' && (
          <>
            {state.winnerPlayerId === null && 'It’s a draw — well played!'}
            {state.winnerPlayerId === myPlayerId && 'You won this one!'}
            {state.winnerPlayerId &&
              state.winnerPlayerId !== myPlayerId &&
              'Your opponent won this time.'}
          </>
        )}
      </p>
    </div>
  );
}
