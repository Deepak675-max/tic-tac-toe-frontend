import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function AuthPanel() {
  const { login, register } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handle(
    fn: (u: string) => Promise<void>,
  ) {
    setError(null);
    const u = username.trim();
    if (u.length < 2) {
      setError('Username must be at least 2 characters.');
      return;
    }
    setBusy(true);
    try {
      await fn(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <section className="panel auth-panel">
        <h1 className="auth-title">Welcome back</h1>
        <p className="muted auth-sub">
          Pick a display name to play. No password in this demo — use a new name
          to create an account, or the same name you used before to sign in.
        </p>
        <label className="field">
          <span>Your name</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Alex"
            autoComplete="username"
            disabled={busy}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="row auth-actions">
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={() => handle(register)}
          >
            Create account
          </button>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => handle(login)}
          >
            I already have a name
          </button>
        </div>
      </section>
    </div>
  );
}
