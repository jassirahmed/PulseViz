"use client";

import { motion } from "framer-motion";
import { Settings, Download, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import VisualizerSettingsModal from "./VisualizerSettingsModal";

export type VisualizerSettings = {
  bars: number;
  barLength: number;
  radiusMultiplier: number;
  sensitivity: number;
  maxBarHeight: number;
  fftSize: number;
  lineWidth: number;
  shadowBlur: number;
  startColor: string;
  endColor: string;
  bgStartColor: string;
  bgEndColor: string;
};

interface AudioVisualizerProps {
  // Newly added props to control animation and per-instance settings
  isMuted: boolean;
  settings: VisualizerSettings;
  onSettingsChange: (s: VisualizerSettings) => void;
  title?: string;
}

export default function AudioVisualizer({
  isMuted,
  settings,
  onSettingsChange,
  title,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const mediaSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const cleanupAudio = useCallback(async () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (mediaSourceRef.current) {
      try {
        mediaSourceRef.current.disconnect();
      } catch {}
      mediaSourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContext) {
      try {
        await audioContext.close();
      } catch {}
      setAudioContext(null);
    }
    setAnalyser(null);
    setIsPlaying(false);
    setAudioLevel(0);
  }, [audioContext]);

  const setupMicrophone = useCallback(async () => {
    if (isMuted) {
      setIsPlaying(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new AudioContext();
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = settings.fftSize;
      analyserNode.smoothingTimeConstant = 0.75;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyserNode);

      mediaSourceRef.current = source;
      setAudioContext(audioCtx);
      setAnalyser(analyserNode);
      setIsPlaying(true);
    } catch (err) {
      console.error("Microphone access denied or unavailable:", err);
      setIsPlaying(false);
    }
  }, [isMuted, settings.fftSize]);

  // Start/stop microphone based on mute state
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await cleanupAudio();
      if (!isMuted && !cancelled) {
        await setupMicrophone();
      }
    };

    run();

    return () => {
      cancelled = true;
      // Cleanup handled by next effect/unmount
    };
  }, [isMuted, setupMicrophone, cleanupAudio]);

  // Update analyser fft size if settings change
  useEffect(() => {
    if (analyser && analyser.fftSize !== settings.fftSize) {
      analyser.fftSize = settings.fftSize;
    }
  }, [analyser, settings.fftSize]);

  // Drawing loop
  useEffect(() => {
    if (!analyser || isMuted) return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius =
        Math.min(canvas.width, canvas.height) * settings.radiusMultiplier;
      const angleStep = (Math.PI * 2) / settings.bars;

      const avgLevel =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(avgLevel / 255);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < settings.bars; i++) {
        const rawValue = dataArray[i];
        const normalizedValue =
          Math.pow(rawValue / 255, 2) *
          settings.maxBarHeight *
          settings.sensitivity;
        const barHeight = Math.max(settings.barLength, normalizedValue);

        const angle = i * angleStep;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const xEnd = centerX + Math.cos(angle) * (radius + barHeight);
        const yEnd = centerY + Math.sin(angle) * (radius + barHeight);

        const gradient = ctx.createLinearGradient(x, y, xEnd, yEnd);
        gradient.addColorStop(0, settings.startColor);
        gradient.addColorStop(1, settings.endColor);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = settings.lineWidth;
        ctx.lineCap = "round";
        ctx.shadowBlur = settings.shadowBlur;
        ctx.shadowColor = settings.endColor;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [analyser, isMuted, settings]);

  useEffect(() => {
    return () => {
      // Unmount cleanup
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const downloadSettings = () => {
    const settingsData = {
      name: title ? `Settings - ${title}` : "Custom Visualizer Settings",
      timestamp: new Date().toISOString(),
      settings,
    };

    const blob = new Blob([JSON.stringify(settingsData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visualizer-settings-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full h-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-2"
      >
        <Badge
          variant={!isMuted && isPlaying ? "default" : "secondary"}
          className="flex items-center gap-2 px-3 py-1"
        >
          {!isMuted && isPlaying ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Audio
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              No Audio
            </>
          )}
        </Badge>

        {!isMuted && isPlaying && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                style={{ width: `${audioLevel * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Visualizer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative group"
      >
        <Card className="p-0 overflow-hidden border-0 shadow-2xl transition-all duration-300 group-hover:shadow-3xl backdrop-blur-sm bg-white/5 dark:bg-black/20">
          <CardContent className="p-0 relative">
            <div
              className="rounded-lg relative transition-all duration-500"
              style={{
                background: `linear-gradient(135deg, ${settings.bgStartColor}, ${settings.bgEndColor})`,
              }}
            >
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full h-auto max-w-[400px] max-h-[400px] mx-auto transition-all duration-300 group-hover:scale-[1.02]"
              />

              {/* Controls */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute top-4 right-4 flex gap-2"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={downloadSettings}
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white transition-all duration-200 cursor-pointer"
                    aria-label="Download settings"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => setIsSettingsOpen(true)}
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white transition-all duration-200 cursor-pointer"
                    aria-label="Open settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>

              {/* Optional overlay when muted */}
              {isMuted && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center text-white/80 text-sm px-3 py-1 rounded bg-black/30 backdrop-blur-sm">
                    Microphone muted
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings Modal */}
      <VisualizerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    </div>
  );
}
