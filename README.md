# AI Agentic Whiteboard

An intelligent collaborative whiteboard where authenticated users can draw diagrams, add shapes, upload images, save whiteboards, and use an AI assistant to generate and modify diagrams directly on the canvas.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, Excalidraw |
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| Auth | Firebase Authentication (Google + Email/Password), Firebase Admin SDK |
| AI | Google Gemini API (gemini-1.5-flash) |

## Features

- **Authentication** — Google Sign-In, email/password, protected routes, Firebase token verification
- **Dashboard** — Create, list, open, and delete whiteboards
- **Canvas** — Full Excalidraw integration with drawing, shapes, text, arrows, zoom, pan, undo/redo
- **Autosave** — Debounced save (1.5s) with Saving/Saved status indicators
- **Multi-Agent AI** — Google Gemini Multi-Agent diagram intent, planning, and reviewer pipeline
- **Layout Engine** — ELK.js graph layout engine (determines node positions & group containers)
- **Native Elements** — Native 100% editable Excalidraw elements (rectangles, ellipses, diamonds, bound text, arrows)
- **Image Upload** — PNG, JPG, JPEG, WEBP support via Excalidraw (persisted in board state)

## Project Structure

```
ai-agentic-whiteboard/
├── client/          # React frontend
├── server/          # Express API
├── package.json     # Root scripts
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Firebase project with Authentication enabled
- Google Gemini API key (`GEMINI_API_KEY`)

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment variables

**Server** — copy `server/.env.example` to `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-agentic-whiteboard
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

Without `AI_API_KEY`, the server uses a **mock AI provider** with rule-based diagram generation for development.

**Client** — copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Firebase setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Email/Password** and **Google** sign-in providers
3. Add a web app and copy config values to `client/.env`
4. Generate a service account key (Project Settings → Service Accounts) for the backend

### 4. Run the application

```bash
# Start both client and server
npm run dev

# Or separately:
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173
```

## API Endpoints

### Boards (authenticated)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/boards` | Create a new board |
| GET | `/api/boards` | List user's boards |
| GET | `/api/boards/:id` | Get board by ID |
| PUT | `/api/boards/:id` | Update board (autosave) |
| DELETE | `/api/boards/:id` | Delete board |

### AI (authenticated)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/ai/generate` | Generate diagram from prompt |
| POST | `/api/ai/modify` | Modify existing diagram |

## AI Architecture

```
User Prompt → AI Intent Analysis → Diagram Plan → Structured JSON
    → Layout Engine → Excalidraw Converter → Canvas Update
```

The AI returns structured diagram data (nodes + connections). A layout engine assigns coordinates, and a converter transforms the result into Excalidraw elements.

## Deployment

```bash
# Build frontend
npm run build

# Start production server
npm start
```

Serve the `client/dist` folder statically from Express or deploy frontend and backend separately.

## License

MIT
