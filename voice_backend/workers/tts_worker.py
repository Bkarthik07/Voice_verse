import multiprocessing
import os
import requests
import io
import wave
import traceback
import time

def download_file(url, local_path):
    if not os.path.exists(local_path):
        print(f"[TTS Worker] Downloading {local_path}...")
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            with open(local_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        print(f"[TTS Worker] Downloaded {local_path}.")

def tts_worker(text_llm: multiprocessing.Queue, audio_out: multiprocessing.Queue):
    """
    TTS worker process using Piper TTS.
    Reads sentences and streams raw PCM chunks to audio_out.
    """
    import config
    from piper.voice import PiperVoice

    print("[TTS Worker] Ensuring Piper models are downloaded...")
    download_file(config.TTS_MODEL_URL, config.TTS_MODEL_PATH)
    download_file(config.TTS_CONFIG_URL, config.TTS_CONFIG_PATH)

    print(f"[TTS Worker] Loading TTS model: {config.TTS_MODEL_PATH}")
    voice = PiperVoice.load(config.TTS_MODEL_PATH, config.TTS_CONFIG_PATH)
    print("[TTS Worker] Piper TTS loaded.")
    print(f"[TTS Worker] Sample rate: {voice.config.sample_rate}")

    while True:
        try:
            item = text_llm.get()
            if item is None:
                break

            session_id, sentence, is_final, t_stt_end = item

            if sentence:
                # Strip any leftover special tokens
                sentence = sentence.replace("</s>", "").strip()
                print(f"[TTS] Synthesizing: {sentence}")
                try:
                    t_tts_start = time.time()
                    wav_io = io.BytesIO()
                    # synthesize_wav expects a wave.Wave_write — it sets headers internally
                    with wave.open(wav_io, 'wb') as wav_writer:
                        voice.synthesize_wav(sentence, wav_writer)

                    wav_io.seek(0)
                    with wave.open(wav_io, 'rb') as r:
                        n_frames = r.getnframes()
                        raw_pcm = r.readframes(n_frames)

                    print(f"[TTS Worker] PCM bytes: {len(raw_pcm)}")
                    if raw_pcm:
                        t_tts_end = time.time()
                        tts_latency = t_tts_end - t_tts_start
                        e2e_latency = t_tts_end - t_stt_end
                        print(f"[LATENCY] ⏱️  TTS={tts_latency:.3f}s | End-to-End (STT→LLM→TTS)={e2e_latency:.3f}s")
                        audio_out.put((session_id, raw_pcm, False))

                except Exception:
                    print(f"[TTS Worker] Synthesis Error:\n{traceback.format_exc()}")

            if is_final:
                # Send empty chunk to notify end of message
                audio_out.put((session_id, b"", True))

        except Exception as e:
            print(f"[TTS Worker] Worker Error: {e}")
