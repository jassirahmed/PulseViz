"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MicOff, Settings, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
const DEFAULT_SETTINGS: VisualizerSettings = {
  bars: 60,
  barLength: 10,
  radiusMultiplier: 0.3,
  sensitivity: 2,
  maxBarHeight: 20,
  fftSize: 512,
  lineWidth: 4,
  shadowBlur: 15,
  startColor: "#06b6d4",
  endColor: "#8b5cf6",
  bgStartColor: "#0f172a",
  bgEndColor: "#000000",
};
export function VisualizerInstance({
  analyser,
  isMuted,
  settings = DEFAULT_SETTINGS,
  onOpenSettings,
  onSettingsChange,
}: {
  analyser: AnalyserNode | null;
  isMuted: boolean;
  settings: VisualizerSettings;
  onOpenSettings: () => void;
  onSettingsChange: (settings: VisualizerSettings) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLive, setIsLive] = useState(false);
  const rafRef = useRef<number | null>(null);

  /* -------------------------- Drawing Effect -------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 420;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!analyser || isMuted) {
      setIsLive(false);
      ctx.clearRect(0, 0, size, size);
      return;
    }

    setIsLive(true);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      if (analyser.fftSize !== settings?.fftSize)
        analyser.fftSize = settings?.fftSize;

      const w = size;
      const h = size;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * settings?.radiusMultiplier;
      const angleStep = (Math.PI * 2) / settings?.bars;

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < settings?.bars; i++) {
        const raw = dataArray[i % dataArray.length];
        const normalized =
          Math.pow(raw / 255, 2) *
          settings?.maxBarHeight *
          settings?.sensitivity;
        const barHeight = Math.max(settings?.barLength, normalized);
        const angle = i * angleStep;

        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const xEnd = cx + Math.cos(angle) * (radius + barHeight);
        const yEnd = cy + Math.sin(angle) * (radius + barHeight);

        const gradient = ctx.createLinearGradient(x, y, xEnd, yEnd);
        gradient.addColorStop(0, settings?.startColor);
        gradient.addColorStop(1, settings?.endColor);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = settings?.lineWidth;
        ctx.lineCap = "round";
        ctx.shadowBlur = settings?.shadowBlur;
        ctx.shadowColor = settings?.endColor;

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

  /* ----------------------- Handlers ----------------------- */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
      toast("Settings copied", {
        description: "Visualizer settings JSON copied to clipboard.",
        closeButton: true,
      });
    } catch {
      toast.error("Failed to copy settings");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.settings) onSettingsChange({ ...settings, ...data.settings });
      } catch {
        toast.error("Invalid settings file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDownload = () => {
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
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="p-0 overflow-hidden border-0 shadow-xl group">
          <CardContent className="relative p-0">
            <div
              className="cursor-pointer relative rounded-lg"
              role="button"
              aria-label="Copy settings JSON"
              style={{
                background: `linear-gradient(135deg, ${settings?.bgStartColor}, ${settings?.bgEndColor})`,
              }}
            >
              {/* Status Overlays */}
              {isMuted && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Badge
                    variant="destructive"
                    className="flex items-center gap-2 px-4 py-2 shadow-lg"
                  >
                    <MicOff className="w-4 h-4" /> Mic Muted
                  </Badge>
                </div>
              )}

              {!isMuted && !isLive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-2 px-4 py-2 shadow-md"
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full bg-yellow-400"
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    No Audio Detected
                  </Badge>
                </div>
              )}

              <canvas
                ref={canvasRef}
                onClick={handleCopy}
                className="w-[420px] h-[420px] max-w-full max-h-[420px] mx-auto group-hover:scale-[1.02] transition-all duration-300"
              />

              {/* Controls */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="secondary" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="secondary" onClick={onOpenSettings}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
