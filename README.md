# Tic-tac-toe client (React)

Vite + React + TypeScript + **React Router** UI for the NestJS game server.

**System architecture (client + API + DB + Redis):** see [../docs/HIGH_LEVEL_ARCHITECTURE.md](../docs/HIGH_LEVEL_ARCHITECTURE.md).

## Setup

```bash
cd frontend
cp .env.example .env   # optional — defaults target localhost:3000
npm install
npm run dev
```

The dev server defaults to **http://localhost:5173**. Ensure the API is running on the URL in `VITE_API_URL` (default `http://localhost:3000/api/v1`) and that `VITE_SOCKET_BASE` matches the server origin (default `http://localhost:3000`).

## Pages

| Path | Description |
|------|-------------|
| `/` | **Play** — quick match, friend rooms, join by code |
| `/leaderboard` | Rankings (wins, losses, streak) |
| `/games` | **My games** — recent matches with status and “Open game” |
| `/help` | **How it works** — relaxed vs timed, modes explained |

Sign-in uses a simple name (no password in this demo). In-game flow is unchanged (Socket.IO `/game`).

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
# tic-tac-toe-frontend
