"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseSharedMicOptions = {
  autoStart?: boolean;
};

export function useSharedMic(
  options: UseSharedMicOptions = { autoStart: true }
) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const start = useCallback(async () => {
    try {
      if (audioContext && streamRef.current && sourceRef.current) {
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
        setIsMuted(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      streamRef.current = stream;
      sourceRef.current = source;
      setAudioContext(ctx);
      setIsMuted(false);
      setPermissionError(null);
      setInitialized(true);
    } catch (err) {
      const error = err as Error;
      setPermissionError(error.message || "Microphone access denied");
      setInitialized(true);
    }
  }, [audioContext]);

  const mute = useCallback(async () => {
    if (!audioContext) return;
    await audioContext.suspend();
    setIsMuted(true);
  }, [audioContext]);

  const unmute = useCallback(async () => {
    await start();
    if (audioContext && audioContext.state === "suspended") {
      await audioContext.resume();
    }
    setIsMuted(false);
  }, [audioContext, start]);

  const toggleMute = useCallback(async () => {
    if (!audioContext || audioContext.state === "suspended" || isMuted) {
      await unmute();
    } else {
      await mute();
    }
  }, [audioContext, isMuted, mute, unmute]);

  const createAnalyser = useCallback(
    (opts?: { fftSize?: number; smoothing?: number }) => {
      if (!audioContext || !sourceRef.current) return null;
      const analyser = audioContext.createAnalyser();
      if (typeof opts?.fftSize === "number") analyser.fftSize = opts.fftSize;
      if (typeof opts?.smoothing === "number")
        analyser.smoothingTimeConstant = opts.smoothing;
      sourceRef.current.connect(analyser);
      return analyser;
    },
    [audioContext]
  );

  useEffect(() => {
    if (options.autoStart) {
      start().catch(() => {});
    }
  }, [options.autoStart, start]);

  return {
    audioContext,
    isMuted,
    initialized,
    permissionError,
    start,
    mute,
    unmute,
    toggleMute,
    createAnalyser,
  };
}
