export function HelpPage() {
  return (
    <div className="page help-page">
      <header className="page-header">
        <h1 className="page-title">How it works</h1>
        <p className="page-lead">
          A quick guide so you know what each option means.
        </p>
      </header>

      <div className="help-sections">
        <section className="card help-card">
          <h2 className="card-title">Game styles</h2>
          <ul className="help-list">
            <li>
              <strong>Relaxed</strong> — No countdown. Take as long as you need
              for each move.
            </li>
            <li>
              <strong>Beat the clock</strong> — You have about{' '}
              <strong>30 seconds</strong> per move. A live timer and progress bar
              show how much time is left on the current turn. If time runs out on
              your turn, you lose the match.
            </li>
          </ul>
        </section>

        <section className="card help-card">
          <h2 className="card-title">Ways to play</h2>
          <ul className="help-list">
            <li>
              <strong>Quick match</strong> — We find another player who picked
              the same style. You’ll get a game as soon as someone else is
              waiting too.
            </li>
            <li>
              <strong>Play with a friend</strong> — You create a room and get a
              short code. Share it; your friend enters it to join the same game.
            </li>
            <li>
              <strong>Join a friend’s room</strong> — Paste the code they sent
              you and tap <em>Join this room</em>.
            </li>
          </ul>
        </section>

        <section className="card help-card">
          <h2 className="card-title">During a game</h2>
          <p className="card-desc">
            Tap an empty square on your turn. ✕ and ○ show who is which side.
            When the game ends, your result is saved and can appear on the
            leaderboard and under <strong>My games</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
