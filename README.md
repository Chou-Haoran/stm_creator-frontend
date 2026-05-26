# STM Creator — Frontend

A browser-based State and Transition Model (STM) diagram editor with real-time multi-user collaboration, built for the ANU TechLauncher program.

---

## Tech stack

| Item | Detail |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Diagram canvas | @xyflow/react (React Flow) v12 |
| Routing | react-router-dom v7 |
| Real-time collab | socket.io-client v4 |
| Graph layout | elkjs v0.9 |
| Image export | html-to-image |
| Package manager | npm |
| Node version | 20.x |

---

## Prerequisites

- **Node.js 20.x** — check with `node -v`. Install via [nvm](https://github.com/nvm-sh/nvm) or the [official installer](https://nodejs.org).
- **npm** (bundled with Node).
- A running instance of the STM Creator backend (see [Backend repository](#backend-repository)).

---

## Install

```bash
npm install
```

---

## Run locally

Copy the example environment file and fill in the values:

```bash
cp .env.example .env.local
# edit .env.local with your local backend URL
```

Start the Vite development server:

```bash
npm run dev
```

The app is available at `http://localhost:5173` by default. Changes are reflected immediately (HMR).

---

## Build for production

```bash
npm run build
```

Output goes to `dist/`. To preview the production build locally:

```bash
npm run preview
```

To serve the built output (used by Heroku via `Procfile`):

```bash
npm run start          # serves dist/ on $PORT (default 3000)
```

---

## Environment variables

All variables are prefixed with `VITE_` so Vite injects them at build time. Create a `.env.local` file (gitignored) for local overrides.

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | Base URL of the backend REST API (no trailing slash). If omitted the app falls back to the hardcoded cloud URL at build time. | `http://localhost:3000` |
| `VITE_COLLAB_URL` | No | Socket.IO server URL for real-time collaboration. Defaults to `VITE_API_BASE_URL` when not set. Set this only if the WebSocket server runs on a different host/port. | `http://localhost:3000` |
| `VITE_MODEL_NAME` | No | Name of the STM model loaded by default. Used by the demo dataset loader. | `BMRG Rainforests` |

See `.env.example` for a copy-paste starting point.

---

## Connectivity smoke test

A Node script is included to verify the frontend can reach the backend end-to-end (no browser required):

```bash
API_BASE=http://localhost:3000 \
EMAIL=user@example.com \
PASSWORD=YourPassword \
npm run connect-demo
```

Optional flags: `ROLE=Admin`, `MODEL_NAME="BMRG Rainforests"`, `SAVE=true` (saves a demo model, requires Editor or Admin role).

---

## Docker / full-stack setup

A `Dockerfile` and full-stack `docker-compose.yml` are included as part of the project handover package. Refer to the backend repository for the compose file that wires the frontend, backend, and database together.

---

## Backend repository

[BACKEND_REPO_URL]

---

## Documentation

Full developer, operation, and API manuals are in the `doc/` folder:

| File | Content |
|---|---|
| `doc/DEVELOPER_MANUAL_EN.pdf` | Local setup, architecture, contribution guide |
| `doc/OPERATION_MANUAL_EN.pdf` | Deployment and operations runbook |
| `doc/API_MANUAL_EN.pdf` | Backend REST API reference |
| `doc/PROJECT_FILE_OVERVIEW_EN.pdf` | Codebase structure overview |

Additional handover documentation: [CONFLUENCE_URL]

---

## License

MIT — see [LICENSE](LICENSE).

> **Note:** The `LICENSE` file currently carries the copyright of webkid GmbH (the React Flow template this project was scaffolded from). Update the copyright holder to the project team before final public release.
