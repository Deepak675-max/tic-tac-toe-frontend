import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Matches `@media (max-width: 719px)` nav-toggle rules in `App.css`. */
const COLLAPSE_NAV_QUERY = '(max-width: 719px)';

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function AppLayout() {
  const { player, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navPanelId = useId();
  const collapseNav = useMediaQuery(COLLAPSE_NAV_QUERY);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) {
      document.body.classList.remove('nav-menu-open');
      return;
    }
    document.body.classList.add('nav-menu-open');
    return () => document.body.classList.remove('nav-menu-open');
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || !collapseNav) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen, collapseNav]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="app-frame">
      <header className="top-nav">
        <div className="top-nav-head">
          <NavLink to="/" className="brand" end onClick={closeMenu}>
            Tic Tac Toe
          </NavLink>
          <button
            type="button"
            className={`nav-menu-btn ${menuOpen ? 'is-open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls={navPanelId}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="nav-menu-bars" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
        <div
          id={navPanelId}
          className={`nav-panel ${menuOpen ? 'is-open' : ''}`}
          aria-hidden={collapseNav && !menuOpen ? true : undefined}
          inert={collapseNav && !menuOpen ? true : undefined}
        >
          <nav className="nav-links" aria-label="Main">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'nav-link is-active' : 'nav-link'
              }
              end
              onClick={closeMenu}
            >
              Play
            </NavLink>
            <NavLink
              to="/leaderboard"
              className={({ isActive }) =>
                isActive ? 'nav-link is-active' : 'nav-link'
              }
              onClick={closeMenu}
            >
              Leaderboard
            </NavLink>
            <NavLink
              to="/games"
              className={({ isActive }) =>
                isActive ? 'nav-link is-active' : 'nav-link'
              }
              onClick={closeMenu}
            >
              My games
            </NavLink>
            <NavLink
              to="/help"
              className={({ isActive }) =>
                isActive ? 'nav-link is-active' : 'nav-link'
              }
              onClick={closeMenu}
            >
              How it works
            </NavLink>
          </nav>
          <div className="nav-user">
            <span className="user-pill" title="Signed in as">
              Hi, <strong>{player?.username}</strong>
            </span>
            <button
              type="button"
              className="btn ghost btn-sm"
              onClick={() => {
                closeMenu();
                logout();
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="page-main">
        <Outlet />
      </main>
    </div>
  );
}
