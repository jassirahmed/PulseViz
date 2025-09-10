"use client";

import type React from "react";

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
  // New fields
  shape?: "bars" | "dots" | "waveform" | "polygon";
  rotationSpeed?: number; // revolutions per second
  barSpacing?: number; // inner radial gap in px (visual gap between inner circle and bars/dots)
  opacity?: number; // 0..1 global alpha
  glowColor?: string | null;
  dynamicColors?: boolean;
  rainbowMode?: boolean;
  showPeaks?: boolean;
  animateBackground?: boolean;
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
  // New defaults
  shape: "bars",
  rotationSpeed: 0,
  barSpacing: 4,
  opacity: 1,
  glowColor: null,
  dynamicColors: false,
  rainbowMode: false,
  showPeaks: true,
  animateBackground: true,
};

function getValidFFTSize(size: number): number {
  const validSizes = [
    32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768,
  ];
  return validSizes.includes(size) ? size : 2048; // fallback
}
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
    const timeArray = new Uint8Array(analyser.fftSize);

    // Helpers for colors
    function hexToRgb(hex: string) {
      const m = hex.replace("#", "");
      const bigint = Number.parseInt(m, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return { r, g, b };
    }
    function rgbToHex(r: number, g: number, b: number) {
      return (
        "#" +
        [r, g, b]
          .map((x) => {
            const v = Math.max(0, Math.min(255, Math.round(x)));
            const h = v.toString(16);
            return h.length === 1 ? "0" + h : h;
          })
          .join("")
      );
    }
    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }
    function mixHex(a: string, b: string, t: number) {
      const A = hexToRgb(a);
      const B = hexToRgb(b);
      return rgbToHex(lerp(A.r, B.r, t), lerp(A.g, B.g, t), lerp(A.b, B.b, t));
    }
    function hsl(h: number, s: number, l: number) {
      return `hsl(${Math.floor(h)}, ${Math.floor(s * 100)}%, ${Math.floor(
        l * 100
      )}%)`;
    }

    const w = size;
    const h = size;
    const cx = w / 2;
    const cy = h / 2;

    // Rotation timing
    let rotation = 0; // radians
    let lastTs = 0;

    // Peaks tracking
    let peaks = new Float32Array(
      Math.max(1, settings?.bars || DEFAULT_SETTINGS.bars)
    ).fill(0);

    const draw = (ts?: number) => {
      rafRef.current = requestAnimationFrame(draw);

      if (
        analyser.fftSize !==
        getValidFFTSize(settings?.fftSize || DEFAULT_SETTINGS.fftSize)
      ) {
        analyser.fftSize = getValidFFTSize(
          settings?.fftSize || DEFAULT_SETTINGS.fftSize
        );
      }

      // time delta
      const t = (ts ?? 0) / 1000;
      const dt = lastTs ? t - lastTs : 0;
      lastTs = t;

      // update rotation
      const revPerSec =
        settings?.rotationSpeed ?? DEFAULT_SETTINGS.rotationSpeed!;
      rotation = rotation + (revPerSec || 0) * Math.PI * 2 * dt;

      const bars = Math.max(3, settings?.bars ?? DEFAULT_SETTINGS.bars);
      const radiusBase =
        Math.min(w, h) *
        (settings?.radiusMultiplier ?? DEFAULT_SETTINGS.radiusMultiplier!);
      const angleStep = (Math.PI * 2) / bars;
      const innerGap = Math.max(0, settings?.barSpacing ?? 0); // radial gap before drawing
      const globalAlpha = Math.max(0, Math.min(1, settings?.opacity ?? 1));
      const lineWidth = settings?.lineWidth ?? DEFAULT_SETTINGS.lineWidth!;
      const shadowBlur = settings?.shadowBlur ?? DEFAULT_SETTINGS.shadowBlur!;
      const glowColor =
        settings?.glowColor || settings?.endColor || DEFAULT_SETTINGS.endColor;

      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(timeArray);

      // animated background fill on canvas (optional)
      ctx.clearRect(0, 0, w, h);
      if (settings?.animateBackground) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        // subtly oscillate brightness using time
        const pulse = 0.04 * Math.sin(t * 0.8 * Math.PI * 2);
        const bgStart = settings?.bgStartColor || DEFAULT_SETTINGS.bgStartColor;
        const bgEnd = settings?.bgEndColor || DEFAULT_SETTINGS.bgEndColor;

        const startMix =
          pulse > 0
            ? mixHex(bgStart, "#ffffff", pulse)
            : mixHex(bgStart, "#000000", -pulse);
        const endMix =
          pulse > 0
            ? mixHex(bgEnd, "#ffffff", pulse)
            : mixHex(bgEnd, "#000000", -pulse);

        g.addColorStop(0, startMix);
        g.addColorStop(1, endMix);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // prepare style
      ctx.save();
      ctx.globalAlpha = globalAlpha;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.shadowBlur = shadowBlur;
      ctx.shadowColor = glowColor;

      // dynamic/rainbow color helpers
      const useRainbow = !!settings?.rainbowMode;
      const useDynamic = !!settings?.dynamicColors;
      const baseStart = settings?.startColor || DEFAULT_SETTINGS.startColor;
      const baseEnd = settings?.endColor || DEFAULT_SETTINGS.endColor;

      const shape = (settings?.shape || "bars") as
        | "bars"
        | "dots"
        | "waveform"
        | "polygon";

      // Compute normalized amplitudes for the number of bars we plan to draw
      const amplitudes: number[] = [];
      for (let i = 0; i < bars; i++) {
        const raw = dataArray[i % dataArray.length];
        const normalized =
          Math.pow(raw / 255, 2) *
          (settings?.maxBarHeight ?? DEFAULT_SETTINGS.maxBarHeight!) *
          (settings?.sensitivity ?? DEFAULT_SETTINGS.sensitivity!);
        amplitudes.push(
          Math.max(
            settings?.barLength ?? DEFAULT_SETTINGS.barLength!,
            normalized
          )
        );
      }

      // update peaks (decay)
      if (settings?.showPeaks) {
        if (peaks.length !== bars) peaks = new Float32Array(bars);
        const decay = Math.max(0.92, 0.96); // gentle decay
        for (let i = 0; i < bars; i++) {
          const current = radiusBase + innerGap + amplitudes[i];
          peaks[i] = Math.max(peaks[i] * decay, current);
        }
      }

      // Color getters
      const colorForIndex = (i: number, normHeight: number) => {
        if (useRainbow) {
          const hue = (i / bars + t * 0.1) * 360;
          return {
            start: hsl(hue % 360, 0.9, 0.55),
            end: hsl((hue + 40) % 360, 0.9, 0.6),
          };
        }
        if (useDynamic) {
          // weight color mix by normalized height (0..1 heuristic)
          const h = Math.max(
            0,
            Math.min(
              1,
              (normHeight - (settings?.barLength ?? 0)) /
                Math.max(1, settings?.maxBarHeight ?? 1)
            )
          );
          const mixed = mixHex(baseStart, baseEnd, h);
          return { start: baseStart, end: mixed };
        }
        return { start: baseStart, end: baseEnd };
      };

      // Render shapes
      if (shape === "bars") {
        for (let i = 0; i < bars; i++) {
          const angle = i * angleStep + rotation;
          const barLength = amplitudes[i];

          const r0 = radiusBase + innerGap;
          const r1 = r0 + barLength;

          const x0 = cx + Math.cos(angle) * r0;
          const y0 = cy + Math.sin(angle) * r0;
          const x1 = cx + Math.cos(angle) * r1;
          const y1 = cy + Math.sin(angle) * r1;

          const { start, end } = colorForIndex(i, barLength);
          const grad = ctx.createLinearGradient(x0, y0, x1, y1);
          grad.addColorStop(0, start);
          grad.addColorStop(1, end);
          ctx.strokeStyle = grad;

          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
      } else if (shape === "dots") {
        for (let i = 0; i < bars; i++) {
          const angle = i * angleStep + rotation;
          const r = radiusBase + innerGap + amplitudes[i];
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;

          const { start, end } = colorForIndex(i, amplitudes[i]);
          // radial gradient for dot
          const grad = ctx.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            Math.max(2, lineWidth * 1.4)
          );
          grad.addColorStop(0, end);
          grad.addColorStop(1, start);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, Math.max(2, lineWidth * 0.9), 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (shape === "polygon") {
        // Draw a deformable polygon whose vertices are based on amplitudes
        const points: Array<{ x: number; y: number; h: number }> = [];
        for (let i = 0; i < bars; i++) {
          const angle = i * angleStep + rotation;
          const r = radiusBase + innerGap + amplitudes[i];
          points.push({
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
            h: amplitudes[i],
          });
        }
        if (points.length > 1) {
          const avgHeight =
            points.reduce((acc, p) => acc + p.h, 0) / points.length;
          const { start, end } = colorForIndex(Math.floor(bars / 2), avgHeight);
          const grad = ctx.createLinearGradient(0, 0, w, h);
          grad.addColorStop(0, start);
          grad.addColorStop(1, end);

          // Fill
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++)
            ctx.lineTo(points[i].x, points[i].y);
          ctx.closePath();
          ctx.globalAlpha = globalAlpha * 0.35;
          ctx.fill();
          // Stroke outline
          ctx.globalAlpha = globalAlpha;
          ctx.strokeStyle = grad;
          ctx.stroke();
        }
      } else if (shape === "waveform") {
        // Connect points into a continuous ring waveform
        ctx.beginPath();
        let firstX = 0;
        let firstY = 0;
        for (let i = 0; i < bars; i++) {
          const angle = i * angleStep + rotation;
          const r = radiusBase + innerGap + amplitudes[i];
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) {
            ctx.moveTo(x, y);
            firstX = x;
            firstY = y;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();

        const { start, end } = colorForIndex(
          Math.floor(bars / 2),
          amplitudes[Math.floor(bars / 2)] || 0
        );
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, start);
        grad.addColorStop(1, end);

        ctx.strokeStyle = grad;
        ctx.stroke();
      }

      // render peak dots (if enabled and not waveform; works best with bars/dots/polygon)
      if (settings?.showPeaks && shape !== "waveform") {
        for (let i = 0; i < bars; i++) {
          const angle = i * angleStep + rotation;
          const rp = peaks[i] || radiusBase + innerGap + amplitudes[i];
          const xp = cx + Math.cos(angle) * rp;
          const yp = cy + Math.sin(angle) * rp;

          ctx.beginPath();
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.arc(xp, yp, Math.max(1.5, lineWidth * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
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
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
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
