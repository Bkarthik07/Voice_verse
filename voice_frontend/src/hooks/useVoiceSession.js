import { useRef, useState, useCallback } from 'react';

/**
 * useVoiceSession — manages the WebSocket connection to the VoiceVerse backend.
 *
 * connect({ token, sessionId }) — opens the WebSocket with auth query params.
 * All other behaviour (recording, playback, mic toggle) is unchanged.
 */
export function useVoiceSession() {
  const wsRef           = useRef(null);
  const audioContextRef = useRef(null);   // 16kHz recording
  const playbackCtxRef  = useRef(null);   // 22050Hz playback
  const workletNodeRef  = useRef(null);
  const inputRef        = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const streamRef       = useRef(null);

  const [status,      setStatus]      = useState('idle');
  const [transcript,  setTranscript]  = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn,     setIsMicOn]     = useState(true);

  // ── Build WebSocket URL with optional token + sessionId ────────────
  const buildWsUrl = (token, sessionId) => {
    const base   = 'ws://localhost:8000/ws/chat';
    const params = new URLSearchParams();
    if (token)     params.set('token',      token);
    if (sessionId) params.set('session_id', sessionId);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  // ── Connect ────────────────────────────────────────────────────────
  const connect = useCallback(({ token = null, sessionId = null } = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    const ws = new WebSocket(buildWsUrl(token, sessionId));
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setStatus('connected');
    };

    ws.onclose = (ev) => {
      setIsConnected(false);
      setStatus(ev.code === 4001 ? 'error' : 'idle');
    };

    ws.onerror = () => setStatus('error');

    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.status === 'final') setStatus('connected');
        } catch (_) {}
      } else {
        const buf = event.data instanceof ArrayBuffer
          ? event.data
          : await event.data.arrayBuffer();
        if (buf) _playAudioChunk(buf);
      }
    };
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setStatus('idle');
  }, []);

  // ── Playback (PCM int16 @ 22050 Hz) ──────────────────────────────
  const _playAudioChunk = (arrayBuffer) => {
    if (!playbackCtxRef.current) {
      playbackCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 22050 });
    }
    const ctx = playbackCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (nextPlayTimeRef.current < ctx.currentTime) nextPlayTimeRef.current = ctx.currentTime;

    const int16   = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;

    const audioBuf = ctx.createBuffer(1, float32.length, 22050);
    audioBuf.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuf;
    source.connect(ctx.destination);

    const playAt = Math.max(ctx.currentTime, nextPlayTimeRef.current);
    source.start(playAt);
    nextPlayTimeRef.current = playAt + audioBuf.duration;
    setStatus('playing');
  };

  // ── Start Recording ───────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!isMicOn) return;

    if (!playbackCtxRef.current) {
      playbackCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 22050 });
    }
    if (playbackCtxRef.current.state === 'suspended') await playbackCtxRef.current.resume();

    setTranscript('');
    setStatus('listening');

    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    await audioContextRef.current.resume();

    const workletCode = `
      class RecorderProcessor extends AudioWorkletProcessor {
        process(inputs) {
          const ch = inputs[0]?.[0];
          if (ch) {
            const i16 = new Int16Array(ch.length);
            for (let i = 0; i < ch.length; i++) {
              const s = Math.max(-1, Math.min(1, ch[i]));
              i16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            this.port.postMessage(i16.buffer, [i16.buffer]);
          }
          return true;
        }
      }
      registerProcessor('recorder-worklet', RecorderProcessor);
    `;
    const blob      = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);
    await audioContextRef.current.audioWorklet.addModule(workletUrl);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    inputRef.current  = audioContextRef.current.createMediaStreamSource(stream);

    workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'recorder-worklet');
    workletNodeRef.current.port.onmessage = (e) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(e.data);
    };

    inputRef.current.connect(workletNodeRef.current);
  }, [isMicOn]);

  // ── Stop Recording ────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    setStatus('processing');

    workletNodeRef.current?.disconnect();
    inputRef.current?.disconnect();
    workletNodeRef.current = null;
    inputRef.current       = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ status: 'final' }));
    }
  }, []);

  const toggleMic = useCallback(() => setIsMicOn((p) => !p), []);

  return {
    status, isConnected, isMicOn, transcript,
    connect, disconnect, startRecording, stopRecording, toggleMic,
  };
}
