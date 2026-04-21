import os
from dotenv import load_dotenv

load_dotenv()

# ── General ──────────────────────────────────────────────────────────
SAMPLE_RATE = 16000
CHUNK_SIZE  = 1024

# ── Whisper (STT) ────────────────────────────────────────────────────
WHISPER_MODEL   = "tiny.en"
WHISPER_THREADS = max(1, os.cpu_count() // 2)

# ── LLM (Flan-T5 + LoRA) ────────────────────────────────────────────
LLM_MODEL_ID       = "google/flan-t5-base"
LLM_MAX_NEW_TOKENS = 150
LLM_DO_SAMPLE      = False
LLM_TEMPERATURE    = 1.0
ADAPTER_PATH               = "best_adapter"
ADAPTER_GDRIVE_FOLDER_ID   = "1wrwrYth78Z4IIfaPGtnjUQBO8cuYQSMR"

# ── Piper TTS ────────────────────────────────────────────────────────
TTS_MODEL_PATH  = "en_US-amy-medium.onnx"
TTS_CONFIG_PATH = "en_US-amy-medium.onnx.json"
TTS_MODEL_URL   = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx"
TTS_CONFIG_URL  = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx.json"

# ── Queue sizes ──────────────────────────────────────────────────────
QUEUE_MAXSIZE = 50

# ── TiDB Cloud ───────────────────────────────────────────────────────
_raw_tidb = os.getenv("TIDB_URL", "")
# Ensure the correct async driver prefix
if _raw_tidb.startswith("mysql://"):
    TIDB_URL = _raw_tidb.replace("mysql://", "mysql+aiomysql://", 1)
elif _raw_tidb.startswith("mysql+asyncmy://"):
    TIDB_URL = _raw_tidb.replace("mysql+asyncmy://", "mysql+aiomysql://", 1)
else:
    TIDB_URL = _raw_tidb

TIDB_CA_PATH = os.getenv("TIDB_CA_PATH", "./ca.pem")

# ── MongoDB Atlas ────────────────────────────────────────────────────
MONGO_URL = os.getenv("MONGO_URL", "")

# ── JWT Auth ─────────────────────────────────────────────────────────
JWT_SECRET                   = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM                = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES  = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS    = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
