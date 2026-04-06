import asyncio
import multiprocessing
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

import config
from workers.stt_worker import stt_worker
from workers.llm_worker import llm_worker
from workers.tts_worker import tts_worker
from core.cache import qa_cache

app = FastAPI()

# Process tracking
processes = []
audio_in = multiprocessing.Queue(maxsize=config.QUEUE_MAXSIZE)
text_stt = multiprocessing.Queue(maxsize=config.QUEUE_MAXSIZE)
text_llm = multiprocessing.Queue(maxsize=config.QUEUE_MAXSIZE)
audio_out = multiprocessing.Queue(maxsize=config.QUEUE_MAXSIZE)

# Global dictionary to map session_id to an asyncio Queue
active_connections = {}

async def router_task():
    """Reads from the audio_out multiprocessing queue and routes to correct websocket connection queue."""
    loop = asyncio.get_event_loop()
    while True:
        try:
            # We use an executor to avoid blocking the event loop while waiting on the MP queue
            item = await loop.run_in_executor(None, audio_out.get)
            if item is None:
                continue
                
            session_id, audio_bytes, is_final = item
            print(f"[Router] Got chunk for session {session_id}: {len(audio_bytes)} bytes, is_final={is_final}")
            if session_id in active_connections:
                await active_connections[session_id].put((audio_bytes, is_final))
            else:
                print(f"[Router] ⚠️ Session {session_id} not found in active_connections!")
        except BaseException as e: # Catch all exceptions including asyncio.CancelledError
            await asyncio.sleep(0.1)

@app.on_event("startup")
async def startup_event():
    global processes
    
    # Start the multiprocessing workers
    p_stt = multiprocessing.Process(target=stt_worker, args=(audio_in, text_stt), daemon=True)
    p_llm = multiprocessing.Process(target=llm_worker, args=(text_stt, text_llm), daemon=True)
    p_tts = multiprocessing.Process(target=tts_worker, args=(text_llm, audio_out), daemon=True)
    
    p_stt.start()
    p_llm.start()
    p_tts.start()
    
    processes = [p_stt, p_llm, p_tts]
    print("[FastAPI] 🚀 All workers started in background.")
    
    # Start asyncio router task
    asyncio.create_task(router_task())

@app.on_event("shutdown")
async def shutdown_event():
    audio_in.put(None)
    text_stt.put(None)
    text_llm.put(None)
    audio_out.put(None)
    for p in processes:
        p.terminate()
        p.join()
    print("[FastAPI] 🛑 System shutdown.")

@app.get("/")
async def get_index():
    with open("index.html", "r") as f:
        return HTMLResponse(f.read())

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_id = id(websocket)
    print(f"[WebSocket] 🟢 Client connected: {session_id}")
    
    # Connection-specific queue
    session_queue = asyncio.Queue()
    active_connections[session_id] = session_queue
    
    async def sender_task():
        while True:
            audio_bytes, is_final = await session_queue.get()
            try:
                if audio_bytes and len(audio_bytes) > 0:
                    print(f"[Sender] Sending {len(audio_bytes)} bytes to browser")
                    await websocket.send_bytes(audio_bytes)
                if is_final:
                    print(f"[Sender] Sending final signal to browser")
                    await websocket.send_json({"status": "final"})
            except Exception as e:
                print(f"[Sender] Error: {e}")
                break
                
    sender = asyncio.create_task(sender_task())
    
    try:
        while True:
            # We expect binary audio chunks (PCM 16k)
            # OR json messages like {"status": "final"}
            try:
                message = await websocket.receive()
            except RuntimeError:
                break
            
            if "text" in message:
                import json
                data = json.loads(message["text"])
                if data.get("status") == "final":
                    audio_in.put((session_id, b"", True)) # Signal end of input
            elif "bytes" in message:
                audio_in.put((session_id, message["bytes"], False))
                
    except WebSocketDisconnect:
        print(f"[WebSocket] 🔴 Client disconnected: {session_id}")
    finally:
        sender.cancel()
        active_connections.pop(session_id, None)
