import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MOBILE_NAV_QUERY = '(max-width: 768px)';

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
  const [navOpen, setNavOpen] = useState(false);
  const navPanelId = useId();
  const mobileNav = useMediaQuery(MOBILE_NAV_QUERY);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const drawerOpen = mobileNav && navOpen;

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('nav-drawer-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('nav-drawer-open');
    };
  }, [drawerOpen]);

  function closeNav() {
    setNavOpen(false);
  }

  return (
    <div className="app-frame">
      <header className="top-nav">
        <NavLink to="/" className="brand" end onClick={closeNav}>
          Tic Tac Toe
        </NavLink>
        <button
          type="button"
          className={`nav-menu-btn ${drawerOpen ? 'is-open' : ''}`}
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={drawerOpen}
          aria-controls={navPanelId}
          onClick={() => setNavOpen((o) => !o)}
        >
          <span className="nav-menu-bars" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
        {drawerOpen && (
          <button
            type="button"
            className="nav-backdrop"
            tabIndex={-1}
            aria-label="Close menu"
            onClick={closeNav}
          />
        )}
        <div
          id={navPanelId}
          className={`nav-panel ${drawerOpen ? 'is-open' : ''}`}
          aria-hidden={mobileNav && !drawerOpen ? true : undefined}
          inert={mobileNav && !drawerOpen ? true : undefined}
        >
          <nav className="nav-links" aria-label="Main">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'nav-link is-active' : 'nav-link'
              }
              end
              onClick={closeNav}
            >
              Play
            </NavLink>
            <NavLink
              to="/leaderboard"
              className={({ isActive }) =>
                isActive ? 'nav-link is-active' : 'nav-link'
              }
              onClick={closeNav}
            >
              Leaderboard
            </NavLink>
            <NavLink
              to="/games"
              className={({ isActive }) =>
                isActive ? 'nav-link is-active' : 'nav-link'
              }
              onClick={closeNav}
            >
              My games
            </NavLink>
            <NavLink
              to="/help"
              className={({ isActive }) =>
                isActive ? 'nav-link is-active' : 'nav-link'
              }
              onClick={closeNav}
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
                closeNav();
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
