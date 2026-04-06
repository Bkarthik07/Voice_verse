import os

# --- General System Config ---
SAMPLE_RATE = 16000  # 16kHz for whisper and TTS
CHUNK_SIZE = 1024    # WebSocket chunk size

# --- whisper.cpp Config ---
# For CPU, tiny.en is very fast and reasonably accurate.
WHISPER_MODEL = "tiny.en" 
WHISPER_THREADS = max(1, os.cpu_count() // 2)

# --- FLAN-T5-base Config ---
LLM_MODEL_ID = "google/flan-t5-base"
LLM_MAX_NEW_TOKENS = 100
# We will generate greedily for speed, avoiding complex sampling
LLM_DO_SAMPLE = False
LLM_TEMPERATURE = 1.2

# --- Piper TTS Config ---
TTS_MODEL_PATH = "en_US-amy-medium.onnx"
TTS_CONFIG_PATH = "en_US-amy-medium.onnx.json"
TTS_MODEL_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx"
TTS_CONFIG_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx.json"

# --- Queue Sizes ---
# Prevent memory blowing up if one worker gets stuck
QUEUE_MAXSIZE = 50
