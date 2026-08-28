# AI Agentic Whiteboard

An intelligent full-stack collaborative whiteboard application that converts natural language prompts into **100% native, individually editable Excalidraw diagrams** using a multi-agent **Google Gemini AI** pipeline and **ELK.js** graph layout engine.

---

## Key Features

- **Natural Language Diagram Generation**: Generate system architectures, microservices flows, flowcharts, databases schemas, sequence diagrams, and mind maps directly onto the canvas.
- **Native 100% Editable Excalidraw Canvas**: Every generated diagram consists of native Excalidraw elements (rectangles, ellipses, diamonds, bound hand-drawn text, and arrows). You can drag, resize, edit labels, re-color, and group elements freely.
- **Multi-Agent Gemini Architecture**: Powered by Google Gemini AI with dedicated Intent Analyzer, Diagram Planner, and Quality Reviewer agents.
- **ELK.js Automatic Layout Engine**: Automatic graph coordinate placement with orthogonal 90-degree elbow edge routing to prevent criss-crossing lines.
- **User Authentication**: Firebase Authentication (Google Sign-In and Email/Password) with server-side Firebase Admin SDK protection.
- **Dedicated Pricing & Credit Wallet**: Integrated Razorpay payment engine allowing users to view remaining AI credits and purchase credit packs.
- **Autosave & Dashboard Workspace**: Debounced autosaving (1.5s) to MongoDB, allowing users to list, search, open, rename, and delete whiteboards.

---

## System Architecture & AI Generation Flowchart

The diagram generation pipeline processes user natural-language requests through a multi-agent AI pipeline and layout engine to output native Excalidraw diagrams:

![AI Agentic Whiteboard System Architecture Flowchart](./flowchart/00A_WhiteBoardFlowchart.png)

### High-Level Execution Pipeline

```text
User Natural Language Prompt (AIChat.jsx)
           ↓
POST /api/ai/generate-professional-diagram
           ↓
geminiService.js (Central Google Gemini Service)
  ├─ 1. analyzeDiagramIntent()  -> Gemini AI (Intent Agent)
  ├─ 2. planDiagram()           -> Gemini AI (Planner Agent - 0 Hardcoded Coords)
  ├─ 3. validateSemanticDiagram()-> Structure Validation & ID Integrity Checks
  └─ 4. reviewDiagram()         -> Gemini AI (Reviewer Agent Validation Loop)
           ↓
Client Graph Layout Engine (diagramLayoutService.js via ELK.js)
           ↓
Excalidraw Native Element Generator (semanticDiagramToExcalidraw.js)
           ↓
Fully Editable Native Canvas Diagram (WhiteboardCanvas.jsx)
```

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM, Axios, Excalidraw (`@excalidraw/excalidraw`) |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, ELK.js (`elkjs`) |
| **Authentication** | Firebase Auth, Firebase Admin SDK |
| **AI Model Engine** | Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`) |
| **Payments** | Razorpay Checkout SDK |

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas cluster
- **Google Gemini API Key**: Free API Key from [Google AI Studio](https://aistudio.google.com/)
- **Firebase Project**: Firebase console project with Authentication enabled
- **Razorpay Account** *(Optional)*: Key ID & Secret for live payment testing

---

## Project Structure

```
Agentic-Whiteboard/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # Canvas, AIChat, Navbar, BoardCard
│   │   ├── context/           # AuthContext
│   │   ├── pages/             # Dashboard, Whiteboard, Pricing, Login, Register
│   │   ├── services/          # API Axios clients & ELK Layout Engine
│   │   └── utils/             # Semantic Diagram -> Excalidraw Element Converter
│   ├── .env.example
│   └── package.json
├── flowchart/                  # System Architecture & Flowchart Diagrams
│   └── 00A_WhiteBoardFlowchart.png
├── server/                     # Node.js + Express API Backend
│   ├── agents/                # Gemini Intent, Planner, Reviewer Agents
│   ├── config/                # Gemini, Firebase, Razorpay, MongoDB configs
│   ├── controllers/           # AI, Board, Payment, Diagram controllers
│   ├── middleware/            # Auth & Error Handler middlewares
│   ├── models/                # Board, CreditAccount, CreditTransaction models
│   ├── prompts/               # System prompts for Gemini multi-agent pipeline
│   ├── routes/                # API routes
│   ├── services/              # Gemini Service, Layout Service, Credit Service
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json               # Root scripts
└── README.md
```

---

## Quick Start & Setup

### 1. Clone the repository

```bash
git clone https://github.com/jagdishwaghmode/Agentic-Whiteboard.git
cd Agentic-Whiteboard
```

### 2. Install all dependencies

```bash
npm run install:all
```

### 3. Environment Configuration

#### Backend Environment Setup

Create a `.env` file in the `server/` directory (copy from `server/.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-agentic-whiteboard

# Google Gemini AI Configuration
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
ALLOW_MOCK_AUTH=true

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

#### Frontend Environment Setup

Create a `.env` file in the `client/` directory (copy from `client/.env.example`):

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Running the Application

### Start Development Server

Run both frontend and backend concurrently from the root directory:

```bash
npm run dev
```

Or start them in separate terminals:

```bash
# Terminal 1: Backend API (http://localhost:5000)
npm run dev:server

# Terminal 2: Frontend App (http://localhost:5173)
npm run dev:client
```

---

## Production Build

To build the frontend for production:

```bash
npm run build
```

To run the production server:

```bash
npm start
```

---

## API Endpoints

### AI Diagram Generation (`/api/ai`)

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/ai/generate-professional-diagram` | Multi-Agent Gemini pipeline diagram generation |
| `POST` | `/api/ai/generate` | Single-step Gemini diagram generation |

### Boards Management (`/api/boards`)

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/boards` | List user's saved whiteboards |
| `POST` | `/api/boards` | Create a new whiteboard |
| `GET` | `/api/boards/:id` | Fetch whiteboard by ID |
| `PUT` | `/api/boards/:id` | Update whiteboard state (Autosave) |
| `DELETE` | `/api/boards/:id` | Delete whiteboard |

### Payments & Credits (`/api/payments`)

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/payments/credits` | Get user's remaining AI credit balance |
| `GET` | `/api/payments/plans` | Fetch available pricing plans |
| `POST` | `/api/payments/create-order` | Create Razorpay order |
| `POST` | `/api/payments/verify` | Verify Razorpay HMAC payment signature |

---

## Security

- Sensitive credentials (`GEMINI_API_KEY`, `FIREBASE_PRIVATE_KEY`, `RAZORPAY_KEY_SECRET`) are stored strictly in environment `.env` files.
- All `.env` and `node_modules` paths are explicitly listed in `.gitignore` to prevent accidental credential commits.

---

## License

This project is licensed under the MIT License.
