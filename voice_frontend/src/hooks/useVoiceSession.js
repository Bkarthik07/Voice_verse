import { useRef, useState, useCallback } from 'react';

const WS_URL = 'ws://localhost:8000/ws/chat';

export function useVoiceSession() {
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);    // 16kHz for recording
  const playbackCtxRef = useRef(null);     // 22050Hz for playback
  const workletNodeRef = useRef(null);
  const inputRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const streamRef = useRef(null);

  const [status, setStatus] = useState('idle'); // idle | connecting | connected | listening | processing | playing | error
  const [transcript, setTranscript] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);

  // ─── Connect WebSocket ───────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    const ws = new WebSocket(WS_URL);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setStatus('connected');
    };

    ws.onclose = () => {
      setIsConnected(false);
      setStatus('idle');
    };

    ws.onerror = () => {
      setStatus('error');
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.status === 'final') {
            setStatus('connected');
            setTranscript(prev => prev);
          }
        } catch (_) {}
      } else {
        let buf = event.data instanceof ArrayBuffer
          ? event.data
          : await event.data.arrayBuffer();
        if (buf) playAudioChunk(buf);
      }
    };
  }, []);

  // ─── Disconnect ──────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setStatus('idle');
  }, []);

  // ─── Play raw PCM (int16 @ 22050Hz) ─────────────────────────────
  const playAudioChunk = (arrayBuffer) => {
    if (!playbackCtxRef.current) {
      playbackCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 22050 });
    }
    const ctx = playbackCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (nextPlayTimeRef.current < ctx.currentTime) {
      nextPlayTimeRef.current = ctx.currentTime;
    }

    const int16 = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 22050);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const playAt = Math.max(ctx.currentTime, nextPlayTimeRef.current);
    source.start(playAt);
    nextPlayTimeRef.current = playAt + audioBuffer.duration;
    setStatus('playing');
  };

  // ─── Start Recording ─────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!isMicOn) return;

    // Ensure playback context is unlocked
    if (!playbackCtxRef.current) {
      playbackCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 22050 });
    }
    if (playbackCtxRef.current.state === 'suspended') {
      await playbackCtxRef.current.resume();
    }

    setTranscript('');
    setStatus('listening');

    // Create 16kHz recording context
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    await audioContextRef.current.resume();

    // Inline AudioWorklet for low-latency PCM capture
    const workletCode = `
      class RecorderProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input && input.length > 0) {
            const channelData = input[0];
            const int16Array = new Int16Array(channelData.length);
            for (let i = 0; i < channelData.length; i++) {
              const s = Math.max(-1, Math.min(1, channelData[i]));
              int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            this.port.postMessage(int16Array.buffer, [int16Array.buffer]);
          }
          return true;
        }
      }
      registerProcessor('recorder-worklet', RecorderProcessor);
    `;
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);
    await audioContextRef.current.audioWorklet.addModule(workletUrl);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    inputRef.current = audioContextRef.current.createMediaStreamSource(stream);

    workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'recorder-worklet');
    workletNodeRef.current.port.onmessage = (e) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(e.data);
      }
    };

    inputRef.current.connect(workletNodeRef.current);
  }, [isMicOn]);

  // ─── Stop Recording ──────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    setStatus('processing');

    if (workletNodeRef.current && inputRef.current) {
      workletNodeRef.current.disconnect();
      inputRef.current.disconnect();
      workletNodeRef.current = null;
      inputRef.current = null;
    }

    // Stop microphone tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ status: 'final' }));
    }
  }, []);

  const toggleMic = useCallback(() => setIsMicOn(prev => !prev), []);

  return {
    status,
    isConnected,
    isMicOn,
    transcript,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    toggleMic,
  };
}
