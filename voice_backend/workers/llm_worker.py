import multiprocessing
import re
import time
import os


# ---------------------------------------------------------------------------
# Auto-download helper
# ---------------------------------------------------------------------------

def _ensure_adapter_downloaded(adapter_path: str, gdrive_folder_id: str) -> bool:
    required_files = ["adapter_config.json", "adapter_model.safetensors"]
    if all(os.path.isfile(os.path.join(adapter_path, f)) for f in required_files):
        print(f"[LLM Worker]  Adapter already present at '{adapter_path}'")
        return True

    print(f"[LLM Worker]  Adapter not found at '{adapter_path}'. Downloading from Google Drive...")
    try:
        import gdown
        os.makedirs(adapter_path, exist_ok=True)
        url = f"https://drive.google.com/drive/folders/{gdrive_folder_id}"
        gdown.download_folder(url=url, output=adapter_path, quiet=False, use_cookies=False)

        if all(os.path.isfile(os.path.join(adapter_path, f)) for f in required_files):
            print(f"[LLM Worker]  Adapter downloaded successfully to '{adapter_path}'")
            return True
        else:
            print(f"[LLM Worker]  Download finished but required files are missing.")
            return False
    except Exception as e:
        print(f"[LLM Worker]  Failed to download adapter: {e}. Will run base model only.")
        return False


# ---------------------------------------------------------------------------
# LLM Worker Process
# ---------------------------------------------------------------------------

def llm_worker(text_stt, text_llm, db_out=None):
    # text_stt: multiprocessing.Queue   STT  LLM
    # text_llm: multiprocessing.Queue   LLM  TTS
    # db_out:   multiprocessing.Queue   Q&A pairs  MongoDB (optional)
    """
    LLM worker process using Hugging Face transformers (google/flan-t5-base)
    with an optional fine-tuned LoRA adapter loaded via PEFT.

    Pipeline:
        text_stt   [LLM]  text_llm
        text_stt   [LLM]  db_out   (Q&A pairs for MongoDB storage)

    Each item on text_stt : (session_id, transcribed_text, t_stt_end)
    Each item on text_llm : (session_id, sentence, is_end_marker, t_stt_end)
    Each item on db_out   : (session_id, question, full_answer, duration_ms)
    """
    import config
    import torch
    from transformers import T5ForConditionalGeneration, T5Tokenizer, TextStreamer

    device = "cpu"
    dtype  = torch.float32

    # ------------------------------------------------------------------
    # 1. Optionally ensure the LoRA adapter is available locally
    # ------------------------------------------------------------------
    adapter_path = getattr(config, "ADAPTER_PATH", None)
    gdrive_id    = getattr(config, "ADAPTER_GDRIVE_FOLDER_ID", None)
    use_adapter  = False

    if adapter_path:
        base_dir    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        adapter_abs = os.path.join(base_dir, adapter_path)

        if gdrive_id:
            use_adapter = _ensure_adapter_downloaded(adapter_abs, gdrive_id)
        else:
            required    = ["adapter_config.json", "adapter_model.safetensors"]
            use_adapter = all(os.path.isfile(os.path.join(adapter_abs, f)) for f in required)
            if not use_adapter:
                print(f"[LLM Worker]   Adapter files not found. Running base model only.")
    else:
        adapter_abs = None

    # ------------------------------------------------------------------
    # 2. Load tokenizer
    # ------------------------------------------------------------------
    print(f"[LLM Worker] Loading tokenizer: {config.LLM_MODEL_ID}")
    if use_adapter:
        tok_path = adapter_abs if os.path.isfile(os.path.join(adapter_abs, "tokenizer.json")) \
                   else config.LLM_MODEL_ID
    else:
        tok_path = config.LLM_MODEL_ID

    tokenizer = T5Tokenizer.from_pretrained(tok_path)

    # ------------------------------------------------------------------
    # 3. Load base model
    # ------------------------------------------------------------------
    print(f"[LLM Worker] Loading base model: {config.LLM_MODEL_ID}")
    model = T5ForConditionalGeneration.from_pretrained(
        config.LLM_MODEL_ID,
        torch_dtype=dtype,
    )

    # ------------------------------------------------------------------
    # 4. Attach LoRA adapter (PEFT)
    # ------------------------------------------------------------------
    if use_adapter:
        try:
            from peft import PeftModel
            print(f"[LLM Worker]  Loading LoRA adapter from '{adapter_abs}'")
            model = PeftModel.from_pretrained(model, adapter_abs)
            model = model.merge_and_unload()
            print("[LLM Worker]  LoRA adapter merged into base model successfully.")
        except Exception as e:
            print(f"[LLM Worker]  Failed to load PEFT adapter ({e}). Falling back to base model.")

    model.to(device)
    model.eval()

    # ------------------------------------------------------------------
    # 5. Custom streamer  pushes sentences to TTS queue and buffers for DB
    # ------------------------------------------------------------------
    class QueueTextStreamer(TextStreamer):
        def __init__(self, tokenizer, session_id, out_queue,
                     t_stt_end, t_llm_start, question,
                     db_queue, **kwargs):
            super().__init__(tokenizer, **kwargs)
            self.session_id    = session_id
            self.out_queue     = out_queue
            self.t_stt_end     = t_stt_end
            self.t_llm_start   = t_llm_start
            self.question      = question
            self.db_queue      = db_queue
            self.text_buffer   = ""
            self.full_answer   = ""   # accumulates entire response for DB storage

        def on_finalized_text(self, text: str, stream_end: bool = False):
            self.text_buffer += text

            # Flush on sentence boundary or end-of-stream
            if stream_end or re.search(r'[.?!]\s*$', self.text_buffer):
                sentence = self.text_buffer.replace("</s>", "").strip()
                if sentence:
                    latency = time.time() - self.t_llm_start
                    print(f"[LLM]  Sentence ({latency:.3f}s): {sentence}")
                    self.out_queue.put((self.session_id, sentence, False, self.t_stt_end))
                    self.full_answer += (" " if self.full_answer else "") + sentence
                self.text_buffer = ""

            if stream_end:
                # Signal TTS that generation is complete
                self.out_queue.put((self.session_id, "", True, self.t_stt_end))
                # Persist Q&A interaction to MongoDB via db_out queue
                if self.db_queue and self.full_answer:
                    duration_ms = int((time.time() - self.t_stt_end) * 1000)
                    self.db_queue.put((
                        self.session_id,
                        self.question,
                        self.full_answer.strip(),
                        duration_ms,
                    ))

    print("[LLM Worker]  Model ready. Waiting for input")

    # ------------------------------------------------------------------
    # 6. Main inference loop
    # ------------------------------------------------------------------
    while True:
        try:
            item = text_stt.get()
            if item is None:
                break

            session_id, text, t_stt_end = item
            t_llm_start = time.time()
            print(f"[LLM]  Input: {text}")

            prompt = f"Answer the following science question clearly and concisely: {text}"

            inputs = tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=512,
            ).to(device)

            streamer = QueueTextStreamer(
                tokenizer,
                session_id=session_id,
                out_queue=text_llm,
                t_stt_end=t_stt_end,
                t_llm_start=t_llm_start,
                question=text,
                db_queue=db_out,
                skip_prompt=True,
                skip_special_tokens=True,
            )

            with torch.no_grad():
                model.generate(
                    **inputs,
                    max_new_tokens=config.LLM_MAX_NEW_TOKENS,
                    do_sample=config.LLM_DO_SAMPLE,
                    temperature=config.LLM_TEMPERATURE,
                    repetition_penalty=1.5,
                    streamer=streamer,
                )

        except Exception as e:
            print(f"[LLM Worker]  Error: {e}")
            import traceback
            traceback.print_exc()
