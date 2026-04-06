import multiprocessing
import re
import time

def llm_worker(text_stt: multiprocessing.Queue, text_llm: multiprocessing.Queue):
    """
    LLM worker process using Hugging Face transformers (google/flan-t5-base).
    Reads text, generates response, and streams sentences to text_llm queue.
    """
    import config
    import torch
    from transformers import T5ForConditionalGeneration, T5Tokenizer, TextStreamer
    
    print(f"[LLM Worker] Loading LLM model: {config.LLM_MODEL_ID}")
    # For CPU inference, use PyTorch default. Load in FP32 or BF16 depending on CPU.
    dtype = torch.float32
    device = "cpu"
    
    tokenizer = T5Tokenizer.from_pretrained(config.LLM_MODEL_ID)
    model = T5ForConditionalGeneration.from_pretrained(config.LLM_MODEL_ID, torch_dtype=dtype)
    model.to(device)
    
    # Custom Streamer to push sentences to TTS queue correctly
    class QueueTextStreamer(TextStreamer):
        def __init__(self, tokenizer, session_id, out_queue, t_stt_end, t_llm_start, **kwargs):
            super().__init__(tokenizer, **kwargs)
            self.session_id = session_id
            self.out_queue = out_queue
            self.t_stt_end = t_stt_end
            self.t_llm_start = t_llm_start
            self.text_buffer = ""

        def on_finalized_text(self, text: str, stream_end: bool = False):
            self.text_buffer += text
            
            # Flush when a sentence boundary is hit or stream ends
            if stream_end or re.search(r'[.?!]\s*$', self.text_buffer):
                sentence = self.text_buffer.replace("</s>", "").strip()
                if sentence:
                    t_now = time.time()
                    llm_latency = t_now - self.t_llm_start
                    print(f"[LLM] ✅ Sentence in {llm_latency:.3f}s: {sentence}")
                    self.out_queue.put((self.session_id, sentence, False, self.t_stt_end))
                self.text_buffer = ""
                
            if stream_end:
                self.out_queue.put((self.session_id, "", True, self.t_stt_end))

    print("[LLM Worker] LLM loaded.")
    
    while True:
        try:
            item = text_stt.get()
            if item is None:
                break
                
            session_id, text, t_stt_end = item
            t_llm_start = time.time()
            print(f"[LLM] Received input: {text}")
            
            # Format prompt for T5 (or keep as is)
            prompt = f"Provide a short, kind, and scientific step-by-step explanation for the following: {text}"
            inputs = tokenizer(prompt, return_tensors="pt").to(device)
            
            streamer = QueueTextStreamer(
                tokenizer, session_id, text_llm,
                t_stt_end=t_stt_end, t_llm_start=t_llm_start,
                skip_prompt=True
            )
            
            # Generate response
            with torch.no_grad():
                model.generate(
                    **inputs,
                    max_new_tokens=config.LLM_MAX_NEW_TOKENS,
                    do_sample=config.LLM_DO_SAMPLE,
                    temperature=config.LLM_TEMPERATURE,
                    repetition_penalty=1.7,
                    streamer=streamer
                )
                
        except Exception as e:
            print(f"[LLM Worker] Error: {e}")
