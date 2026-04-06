import os
import multiprocessing
import numpy as np
import time

def stt_worker(audio_in: multiprocessing.Queue, text_stt: multiprocessing.Queue):
    """
    Speech-to-Text worker process using faster-whisper.
    Runs on CPU without requiring C++ build tools.
    """
    import config
    from faster_whisper import WhisperModel
    
    print("[STT Worker] Loading Whisper model:", config.WHISPER_MODEL)
    # Using int8 compute type for fast CPU inference
    whisper = WhisperModel(
        config.WHISPER_MODEL, 
        device="cpu", 
        compute_type="int8", 
        cpu_threads=config.WHISPER_THREADS
    )
    print("[STT Worker] Whisper loaded.")

    audio_buffer = []
    
    while True:
        try:
            item = audio_in.get()
            if item is None:
                break
            
            session_id, audio_bytes, is_final = item
            
            # Convert bytes (PCM 16k 16-bit mono) to float32 numpy array normalized to [-1.0, 1.0]
            chunk = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            audio_buffer.extend(chunk.tolist())
            
            if is_final or len(audio_buffer) >= config.SAMPLE_RATE * 5:
                if len(audio_buffer) > config.SAMPLE_RATE * 0.5:
                    np_audio = np.array(audio_buffer, dtype=np.float32)
                    
                    t_stt_start = time.time()
                    # Transcribe using faster-whisper
                    segments, info = whisper.transcribe(np_audio, beam_size=1)
                    text = " ".join([segment.text for segment in segments]).strip()
                    t_stt_end = time.time()
                    
                    if text:
                        stt_latency = t_stt_end - t_stt_start
                        print(f"[STT] ✅ Transcribed in {stt_latency:.3f}s: {text}")
                        # Pass the start timestamp so LLM/TTS can compute cumulative latency
                        text_stt.put((session_id, text, t_stt_end))
                        
                audio_buffer = [] 
                
        except Exception as e:
            print(f"[STT Worker] Error: {e}")
            pass
