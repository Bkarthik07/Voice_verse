<div align="center">

# 🎙️ VoiceVerse

### *A Real-Time Voice-Based AI Science Learning Companion*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![TiDB](https://img.shields.io/badge/TiDB-Cloud-CC0000?style=for-the-badge&logo=mysql&logoColor=white)](https://tidbcloud.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)


**Talk to Eva — your AI science companion — entirely through voice.**  
Speak a question, get a spoken answer in real time.

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Pipeline Flow](#-pipeline-flow)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Design](#-database-design)
- [AI Components](#-ai-components)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**VoiceVerse** is a full-stack, low-latency voice AI application that lets users have natural spoken conversations with **Eva**, an AI science companion powered by a fine-tuned language model. Users speak science questions and receive intelligent, spoken answers — all in real time, with no typing required.

The system is engineered for **CPU-only deployment**, making it accessible without expensive GPU hardware, while maintaining sub-second transcription and near-real-time response latency.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎙️ **Real-Time Voice Chat** | WebSocket-based streaming audio pipeline with live transcription |
| 🧠 **Fine-Tuned AI** | `google/flan-t5-base` with LoRA adapters fine-tuned for science Q&A |
| 🔊 **Natural TTS** | Piper TTS with the `en_US-amy-medium` voice model |
| 🔐 **JWT Auth** | Secure access + refresh token rotation with revocation |
| 📊 **Session Tracking** | Full session history, interaction logs, and milestone badges |
| 🏆 **Gamification** | Achievement milestones (First Session, 5, 10, 25 sessions) |
| 💾 **Dual-DB Architecture** | TiDB Cloud (structured data) + MongoDB Atlas (interaction documents) |
| ⚡ **CPU-Optimised** | `int8` quantised Whisper, PEFT LoRA merge, multiprocessing workers |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                      │
│  Login │ Register │ Home │ Session │ Profile │ Journey │ Companions  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  REST (HTTP) + WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI + Uvicorn)                      │
│                                                                       │
│   ┌─────────────┐   ┌───────────────┐   ┌──────────────────────┐   │
│   │ /auth/*     │   │ /sessions/*   │   │ WebSocket /ws/chat   │   │
│   │ (TiDB)      │   │ (TiDB+Mongo)  │   │ (JWT-protected)      │   │
│   └─────────────┘   └───────────────┘   └──────────┬───────────┘   │
│                                                      │               │
│   ┌───────────────────────────────────────────────── ▼ ──────────┐  │
│   │              Multiprocessing Pipeline                          │  │
│   │                                                                │  │
│   │  audio_in → [STT Worker] → text_stt                           │  │
│   │             faster-whisper tiny.en (int8)                     │  │
│   │                                    ↓                           │  │
│   │                           [LLM Worker] → text_llm + db_out   │  │
│   │                           flan-t5-base + LoRA adapter         │  │
│   │                                              ↓                 │  │
│   │                                    [TTS Worker] → audio_out   │  │
│   │                                    Piper TTS (amy-medium)     │  │
│   └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            │                    │
               ┌────────────┘                    └─────────────┐
               ▼                                               ▼
    ┌───────────────────┐                        ┌───────────────────────┐
    │   TiDB Cloud      │                        │   MongoDB Atlas       │
    │ (MySQL-compatible)│                        │  (Document Store)     │
    │                   │                        │                       │
    │  • users          │                        │  • interactions       │
    │  • voice_sessions │                        │    (Q&A history)      │
    │  • refresh_tokens │                        └───────────────────────┘
    │  • milestones     │
    └───────────────────┘
```

---

## 🔄 Pipeline Flow

```
User speaks
     │
     ▼
Browser captures PCM audio (16kHz, 16-bit mono)
     │  WebSocket stream
     ▼
FastAPI receives audio chunks → audio_in queue
     │
     ▼
┌─────────────────────────────────────────┐
│  STT Worker (faster-whisper tiny.en)    │
│  • Buffers PCM frames                   │
│  • Transcribes on final signal          │
│  • int8 quantisation for CPU speed      │
└───────────────────┬─────────────────────┘
                    │ (session_id, text, timestamp)
                    ▼
┌─────────────────────────────────────────┐
│  LLM Worker (flan-t5-base + LoRA)       │
│  • Prompts: "Answer the following       │
│    science question clearly: {text}"    │
│  • Streams sentences via TextStreamer   │
│  • Queues Q&A to MongoDB               │
└───────────────────┬─────────────────────┘
                    │ (session_id, sentence, is_end)
                    ▼
┌─────────────────────────────────────────┐
│  TTS Worker (Piper TTS — Amy voice)     │
│  • Synthesises each sentence            │
│  • Streams WAV audio bytes back         │
└───────────────────┬─────────────────────┘
                    │ audio bytes
                    ▼
FastAPI audio_router_task → WebSocket → Browser plays audio
```

---

## 🛠️ Tech Stack

### Backend
| Component | Technology |
|---|---|
| Web Framework | FastAPI 0.111+ |
| ASGI Server | Uvicorn (standard) |
| Speech-to-Text | faster-whisper (`tiny.en`, `int8`, CPU) |
| Language Model | `google/flan-t5-base` + PEFT LoRA adapters |
| Text-to-Speech | Piper TTS (`en_US-amy-medium.onnx`) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Relational DB | TiDB Cloud (MySQL-compatible, async via `aiomysql`) |
| Document DB | MongoDB Atlas (async via `motor` + `beanie`) |
| ORM | SQLAlchemy 2.0 (async) |

### Frontend
| Component | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router DOM v7 |
| HTTP Client | Axios |
| Styling | Tailwind CSS v4 |
| Audio | Web Audio API + MediaRecorder |

---

## 📁 Project Structure

```
voice_verse/
├── voice_backend/                # Python FastAPI backend
│   ├── app.py                    # Main app, WebSocket endpoint, lifespan
│   ├── config.py                 # All configuration (env + constants)
│   ├── requirements.txt          # Python dependencies
│   ├── ca.pem                    # TiDB TLS certificate
│   ├── best_adapter/             # Fine-tuned LoRA adapter weights
│   │   ├── adapter_config.json
│   │   └── adapter_model.safetensors
│   ├── en_US-amy-medium.onnx     # Piper TTS voice model
│   ├── en_US-amy-medium.onnx.json
│   ├── auth/                     # JWT utilities & FastAPI dependencies
│   │   ├── jwt_utils.py
│   │   └── dependencies.py
│   ├── core/
│   │   └── cache.py              # In-memory Q&A response cache
│   ├── db/
│   │   ├── tidb.py               # TiDB async session factory
│   │   ├── mongo.py              # MongoDB Atlas init/teardown
│   │   ├── models.py             # SQLAlchemy ORM models
│   │   ├── documents.py          # Beanie document models (MongoDB)
│   │   └── schemas.py            # Pydantic request/response schemas
│   ├── routers/
│   │   ├── auth.py               # /auth/* endpoints
│   │   └── sessions.py           # /sessions/* endpoints
│   └── workers/
│       ├── stt_worker.py         # faster-whisper subprocess
│       ├── llm_worker.py         # flan-t5 + LoRA subprocess
│       └── tts_worker.py         # Piper TTS subprocess
│
└── voice_frontend/               # React + Vite frontend
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx               # Routing root
        ├── api/                  # Axios API client modules
        ├── components/           # Reusable UI components
        ├── context/              # React auth context
        ├── hooks/                # Custom hooks (useAuth, etc.)
        ├── pages/
        │   ├── Home.jsx          # Landing / dashboard
        │   ├── Session.jsx       # Live voice session page
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Profile.jsx       # User stats & milestones
        │   ├── Journey.jsx       # Session history
        │   └── Companions.jsx    # AI companion selection
        └── data/                 # Static data / constants
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher
- **TiDB Cloud** account (free tier works) — for user/session data
- **MongoDB Atlas** account (free tier works) — for interaction history
- A modern browser with microphone access

---

### Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/Bkarthik07/Voice_verse.git
cd Voice_verse/voice_backend
```

**2. Create and activate a virtual environment**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
```

**4. Configure environment variables**

Create a `.env` file in `voice_backend/` (see [Environment Variables](#-environment-variables) below).

**5. Download TTS model** *(first run only — auto-downloads if missing)*

The Piper voice model (`en_US-amy-medium.onnx`) will be downloaded automatically from HuggingFace on first startup, or you can pre-download it:
```bash
# Download manually (optional)
curl -L https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx -o en_US-amy-medium.onnx
curl -L https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx.json -o en_US-amy-medium.onnx.json
```

**6. Download LoRA adapter** *(first run only — auto-downloads from Google Drive)*

The `best_adapter/` folder is fetched automatically from Google Drive on first startup via `gdown`. No manual action needed.

**7. Start the backend server**
```bash
python app.py
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### Frontend Setup

**1. Navigate to the frontend directory**
```bash
cd ../voice_frontend
```

**2. Install dependencies**
```bash
npm install
```

**3. Start the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔐 Environment Variables

Create `voice_backend/.env` with the following:

```env
# ── TiDB Cloud ──────────────────────────────────────────
# Get your connection string from TiDB Cloud console
TIDB_URL=mysql://user:password@host:4000/database?ssl_ca=./ca.pem
TIDB_CA_PATH=./ca.pem

# ── MongoDB Atlas ────────────────────────────────────────
# Get your URI from MongoDB Atlas console
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/voiceverse?retryWrites=true

# ── JWT ──────────────────────────────────────────────────
JWT_SECRET=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30
```


---

## 📡 API Reference

### Authentication — `/auth`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Create a new user account | ❌ |
| `POST` | `/auth/login` | Login and receive tokens | ❌ |
| `POST` | `/auth/refresh` | Rotate access + refresh tokens | ❌ |
| `POST` | `/auth/logout` | Revoke refresh token | ✅ |
| `GET` | `/auth/me` | Get current user profile | ✅ |
| `PATCH` | `/auth/me` | Update username / avatar color | ✅ |

### Sessions — `/sessions`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/sessions/start` | Start a new voice session | ✅ |
| `PATCH` | `/sessions/{id}/end` | End a session & award milestones | ✅ |
| `GET` | `/sessions/history` | Paginated session history | ✅ |
| `GET` | `/sessions/stats` | Total sessions, interactions, milestones | ✅ |
| `GET` | `/sessions/{id}/interactions` | All Q&A for a session | ✅ |

### WebSocket — `/ws/chat`

```
ws://localhost:8000/ws/chat?token={access_token}&session_id={session_id}
```

| Direction | Data Format | Description |
|---|---|---|
| Client → Server | `bytes` | Raw PCM audio (16kHz, 16-bit mono) |
| Client → Server | `JSON {"status": "final"}` | Signal end of speech |
| Server → Client | `bytes` | WAV audio response chunks |
| Server → Client | `JSON {"status": "final"}` | End of TTS response |

---

## 🗄️ Database Design

### TiDB Cloud (Relational)

```
users
├── id           UUID (PK)
├── email        VARCHAR UNIQUE
├── username     VARCHAR
├── password_hash VARCHAR
├── avatar_color VARCHAR
├── is_active    BOOLEAN
└── last_login   DATETIME

voice_sessions
├── id           UUID (PK)
├── user_id      FK → users.id
├── companion    VARCHAR (default: "eva")
├── status       ENUM (active, completed)
├── started_at   DATETIME
├── ended_at     DATETIME
└── duration_s   INT

refresh_tokens
├── id           UUID (PK)
├── user_id      FK → users.id
├── token_hash   VARCHAR (SHA-256)
├── expires_at   DATETIME
└── revoked      BOOLEAN

milestones
├── id           UUID (PK)
├── user_id      FK → users.id
├── key          VARCHAR (e.g. "first_session")
└── earned_at    DATETIME
```

### MongoDB Atlas (Documents)

```json
{
  "collection": "interactions",
  "document": {
    "_id": "ObjectId",
    "session_id": "string",
    "user_id": "string",
    "question": "string",
    "answer": "string",
    "topic": "string | null",
    "duration_ms": "int",
    "created_at": "datetime"
  }
}
```

---

## 🤖 AI Components

### Speech-to-Text — `faster-whisper`
- Model: `tiny.en` (English-only, fastest variant)
- Compute: `int8` quantisation for CPU-only inference
- Threading: auto-scaled to `cpu_count // 2`
- Latency: typically **< 500 ms** for short utterances

### Language Model — `google/flan-t5-base` + LoRA
- Base model: `flan-t5-base` (~250M parameters)
- Fine-tuning: LoRA adapters via PEFT, trained on science Q&A

- Sentence-level streaming: pushes each complete sentence to TTS immediately

### Text-to-Speech — Piper TTS
- Voice: `en_US-amy-medium` (ONNX format)
- Synthesis: sentence-by-sentence for minimal perceived latency
- Output: 22050 Hz WAV audio, streamed as bytes to the client


---

## 🖼️ Screenshots



| Home | Live Session |

| ![Home](/home.png) | ![Session](/Session.png)  |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to your branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request


---



<div align="center">



*VoiceVerse — Where science meets voice.*

</div>
