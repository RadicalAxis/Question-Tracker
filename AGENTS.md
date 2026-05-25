# question-tracker (grind.dev)

## Structure
- `backend/` — Express REST API (CommonJS, `server.js`)
- `frontend/` — React 19 + Vite 8 + ESLint 10 (ESM, plain JSX, no TypeScript)

## Commands

### Backend (`backend/`)
- `npm start` — `node server.js`
- `npm run dev` — `nodemon server.js` (auto-restart)
- Requires `$env:SUPABASE_URL` and `$env:SUPABASE_KEY` for user CRUD
- Default port: 3001 (`$env:PORT` to override)

### Frontend (`frontend/`)
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run lint` — ESLint on all JS/JSX
- `npm run preview` — preview production build

### Root
- No root-level scripts; each package is independent

## Architecture
- CORS wide-open on backend (`*`)
- Backend API URL hardcoded in frontend (`src/App.jsx:3` → Render deployment)
- In-memory 60s cache for Codeforces and LeetCode integrations
- Backend module system: CommonJS (`require`, `module.exports`)
- Frontend module system: ESM (`import`, `export`)

## Notable
- `frontend/src/ChallengeTracker.jsx` is unreferenced dead code (not imported)
- No test infrastructure in either package
- No Docker, no CI/CD config
- No `opencode.json` or instruction files exist yet
