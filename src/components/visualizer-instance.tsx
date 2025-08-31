"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Settings, Download, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

type Props = {
  analyser: AnalyserNode | null;
  isMuted: boolean;
  settings: VisualizerSettings;
  onOpenSettings: () => void;
  onCopySettings?: () => void;
};
const defaultSettings: VisualizerSettings = {
  bars: 64,
  barLength: 2,
  radiusMultiplier: 0.25,
  sensitivity: 1,
  maxBarHeight: 100,
  fftSize: 256,
  lineWidth: 2,
  shadowBlur: 8,
  startColor: "#00f",
  endColor: "#0ff",
  bgStartColor: "#000",
  bgEndColor: "#111",
};
export function VisualizerInstance({
  analyser,
  isMuted,
  settings = defaultSettings,
  onOpenSettings,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLive, setIsLive] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const logical = 420;
    canvas.width = Math.floor(logical * dpr);
    canvas.height = Math.floor(logical * dpr);
    canvas.style.width = `${logical}px`;
    canvas.style.height = `${logical}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!analyser || isMuted) {
      setIsLive(false);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };
    }

    setIsLive(true);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      if (analyser.fftSize !== settings.fftSize) {
        analyser.fftSize = settings.fftSize;
      }

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * settings.radiusMultiplier;
      const angleStep = (Math.PI * 2) / settings.bars;

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < settings.bars; i++) {
        const raw = dataArray[i % dataArray.length];
        const normalized =
          Math.pow(raw / 255, 2) * settings.maxBarHeight * settings.sensitivity;
        const barHeight = Math.max(settings.barLength, normalized);
        const angle = i * angleStep;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const xEnd = cx + Math.cos(angle) * (radius + barHeight);
        const yEnd = cy + Math.sin(angle) * (radius + barHeight);

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

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [analyser, isMuted, settings]);

  const downloadSettings = () => {
    const payload = {
      name: "Visualizer Settings",
      timestamp: new Date().toISOString(),
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
      toast("Settings copied", {
        description: "Visualizer settings JSON copied to clipboard.",
        closeButton: true,
      });
    } catch {
      toast.error("Failed to copy settings", { closeButton: true });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group"
      >
        <Card className="p-0 overflow-hidden border-0 shadow-xl transition-all duration-300 group-hover:shadow-2xl backdrop-blur-sm bg-white/5 dark:bg-black/20">
          <CardContent className="p-0 relative">
            <div
              className="cursor-pointer rounded-lg relative transition-all duration-500"
              role="button"
              aria-label="Copy settings JSON"
              style={{
                background: `linear-gradient(135deg, ${settings.bgStartColor}, ${settings.bgEndColor})`,
              }}
            >
              {isMuted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Badge
                    variant="destructive"
                    className="flex items-center gap-2 px-4 py-2 text-sm shadow-lg"
                  >
                    <MicOff className="w-4 h-4" />
                    Mic Muted
                  </Badge>
                </motion.div>
              ) : (
                !isLive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-2 px-4 py-2 text-sm shadow-md"
                    >
                      {/* pulsing indicator */}
                      <motion.div
                        className="w-2 h-2 rounded-full bg-yellow-400"
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      No Audio Detected
                    </Badge>
                  </motion.div>
                )
              )}

              <canvas
                ref={canvasRef}
                onClick={handleCopy}
                className="w-[420px] h-[420px] max-w-full max-h-[420px] mx-auto transition-all duration-300 group-hover:scale-[1.02]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute top-4 right-4 flex gap-2"
              >
                <Button
                  onClick={downloadSettings}
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white transition-all duration-200 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  onClick={onOpenSettings}
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white transition-all duration-200 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
