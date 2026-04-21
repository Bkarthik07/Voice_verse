import asyncio
import json
import multiprocessing
from typing import Optional

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

import config

#  DB imports 
import db.models  # noqa: F401  registers ORM tables with Base.metadata
from db.tidb   import init_tidb_tables, AsyncSessionLocal
from db.mongo  import init_mongo, close_mongo
from db.documents import Interaction

#  Auth 
from auth.dependencies import ws_validate_token

#  Routers 
from routers.auth     import router as auth_router
from routers.sessions import router as sessions_router

#  Workers 
from workers.stt_worker import stt_worker
from workers.llm_worker import llm_worker
from workers.tts_worker import tts_worker
from core.cache         import qa_cache

#  Multiprocessing queues 
audio_in  = multiprocessing.Queue(maxsize=config.QUEUE_MAXSIZE)
text_stt  = multiprocessing.Queue(maxsize=config.QUEUE_MAXSIZE)
text_llm  = multiprocessing.Queue(maxsize=config.QUEUE_MAXSIZE)
audio_out = multiprocessing.Queue(maxsize=config.QUEUE_MAXSIZE)
db_out    = multiprocessing.Queue(maxsize=config.QUEUE_MAXSIZE)  # Q&A pairs  MongoDB

processes: list[multiprocessing.Process] = []

#  Per-connection state 
# session_id (str UUID)  asyncio.Queue of (audio_bytes, is_final)
active_connections: dict[str, asyncio.Queue] = {}
# session_id  user_id  (for MongoDB interaction ownership)
session_user_map:   dict[str, str]           = {}


#  Async router tasks 

async def audio_router_task():
    """Routes audio chunks from the mp queue to the correct WebSocket queue."""
    loop = asyncio.get_event_loop()
    while True:
        try:
            item = await loop.run_in_executor(None, audio_out.get)
            if item is None:
                continue
            session_id, audio_bytes, is_final = item
            if session_id in active_connections:
                await active_connections[session_id].put((audio_bytes, is_final))
            else:
                print(f"[Router]  Session {session_id} not found in active_connections")
        except Exception:
            await asyncio.sleep(0.1)


async def db_router_task():
    """Reads (session_id, question, answer, duration_ms)  saves to MongoDB Atlas."""
    loop = asyncio.get_event_loop()
    while True:
        try:
            item = await loop.run_in_executor(None, db_out.get)
            if item is None:
                continue
            session_id, question, answer, duration_ms = item
            user_id = session_user_map.get(session_id)
            if user_id and question and answer:
                await Interaction(
                    session_id=session_id,
                    user_id=user_id,
                    question=question,
                    answer=answer,
                    duration_ms=duration_ms,
                ).insert()
                print(f"[DB]  Saved interaction | session={session_id[:8]} | {duration_ms}ms")
        except Exception as e:
            print(f"[DB]  Failed to save interaction: {e}")
            await asyncio.sleep(0.1)


#  Lifespan (startup / shutdown) 

@asynccontextmanager
async def lifespan(app: FastAPI):
    global processes

    #  Startup 
    try:
        await init_mongo()
    except Exception as e:
        print(f"[FastAPI] WARNING: MongoDB init failed (interactions won't be saved): {e}")

    try:
        await init_tidb_tables()
    except Exception as e:
        print(f"[FastAPI] WARNING: TiDB init failed (auth endpoints will error until DB is reachable): {e}")

    p_stt = multiprocessing.Process(target=stt_worker, args=(audio_in, text_stt),           daemon=True)
    p_llm = multiprocessing.Process(target=llm_worker, args=(text_stt, text_llm, db_out),   daemon=True)
    p_tts = multiprocessing.Process(target=tts_worker, args=(text_llm, audio_out),           daemon=True)

    p_stt.start(); p_llm.start(); p_tts.start()
    processes = [p_stt, p_llm, p_tts]
    print("[FastAPI]  All workers started.")

    asyncio.create_task(audio_router_task())
    asyncio.create_task(db_router_task())

    yield  #  server is running

    #  Shutdown 
    for q in (audio_in, text_stt, text_llm, audio_out, db_out):
        q.put(None)
    for p in processes:
        p.terminate(); p.join()
    await close_mongo()
    print("[FastAPI]  System shutdown complete.")


#  App 

app = FastAPI(
    lifespan=lifespan,
    title="VoiceVerse API",
    version="2.0.0",
    description="Voice-based science learning with Eva  authenticated & database-backed.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(sessions_router)


@app.get("/")
async def get_index():
    with open("index.html", "r") as f:
        return HTMLResponse(f.read())


#  WebSocket endpoint 

@app.websocket("/ws/chat")
async def websocket_endpoint(
    websocket:  WebSocket,
    token:      Optional[str] = Query(None),
    session_id: Optional[str] = Query(None),
):
    #  Validate JWT before accepting 
    async with AsyncSessionLocal() as db:
        user = await ws_validate_token(token, db)

    if not user:
        await websocket.close(code=4001, reason="Unauthorized: invalid or missing token")
        return

    #  Choose a unique key for this connection 
    ws_sid = session_id or str(id(websocket))

    await websocket.accept()
    print(f"[WebSocket]  {user.username} connected | session={ws_sid[:8]}")

    session_queue: asyncio.Queue = asyncio.Queue()
    active_connections[ws_sid]   = session_queue
    session_user_map[ws_sid]     = user.id

    #  Sender coroutine 
    async def sender():
        while True:
            audio_bytes, is_final = await session_queue.get()
            try:
                if audio_bytes and len(audio_bytes) > 0:
                    await websocket.send_bytes(audio_bytes)
                if is_final:
                    await websocket.send_json({"status": "final"})
            except Exception as exc:
                print(f"[Sender] Error: {exc}")
                break

    sender_task = asyncio.create_task(sender())

    try:
        while True:
            try:
                message = await websocket.receive()
            except RuntimeError:
                break

            if "text" in message:
                data = json.loads(message["text"])
                if data.get("status") == "final":
                    audio_in.put((ws_sid, b"", True))
            elif "bytes" in message:
                audio_in.put((ws_sid, message["bytes"], False))

    except WebSocketDisconnect:
        print(f"[WebSocket]  {user.username} disconnected | session={ws_sid[:8]}")
    finally:
        sender_task.cancel()
        active_connections.pop(ws_sid, None)
        session_user_map.pop(ws_sid, None)


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
