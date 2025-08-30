"use client";

import { motion } from "framer-motion";
import { Settings, Download, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import VisualizerSettingsModal from "./VisualizerSettingsModal";

export default function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Visualizer settings
  const [visualizerSettings, setVisualizerSettings] = useState({
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
  });

  let animationFrameId: number;

  useEffect(() => {
    setupMicrophone();
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (audioContext) audioContext.close();
    };
  }, []);

  useEffect(() => {
    if (analyser) {
      drawVisualizer(analyser);
    }
  }, [analyser, visualizerSettings]);

  const setupMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = visualizerSettings.fftSize;
      analyserNode.smoothingTimeConstant = 0.75;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyserNode);

      setAudioContext(audioCtx);
      setAnalyser(analyserNode);
      setIsPlaying(true);
      drawVisualizer(analyserNode);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const downloadSettings = () => {
    const settingsData = {
      name: "Custom Visualizer Settings",
      timestamp: new Date().toISOString(),
      settings: visualizerSettings,
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

  const drawVisualizer = (analyser: AnalyserNode) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius =
      Math.min(canvas.width, canvas.height) *
      visualizerSettings.radiusMultiplier;
    const angleStep = (Math.PI * 2) / visualizerSettings.bars;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const avgLevel =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(avgLevel / 255);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < visualizerSettings.bars; i++) {
        const rawValue = dataArray[i];
        const normalizedValue =
          Math.pow(rawValue / 255, 2) *
          visualizerSettings.maxBarHeight *
          visualizerSettings.sensitivity;
        const barHeight = Math.max(
          visualizerSettings.barLength,
          normalizedValue
        );

        const angle = i * angleStep;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const xEnd = centerX + Math.cos(angle) * (radius + barHeight);
        const yEnd = centerY + Math.sin(angle) * (radius + barHeight);

        const gradient = ctx.createLinearGradient(x, y, xEnd, yEnd);
        gradient.addColorStop(0, visualizerSettings.startColor);
        gradient.addColorStop(1, visualizerSettings.endColor);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = visualizerSettings.lineWidth;
        ctx.lineCap = "round";
        ctx.shadowBlur = visualizerSettings.shadowBlur;
        ctx.shadowColor = visualizerSettings.endColor;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
      }
    };

    draw();
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full h-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-4"
      >
        <Badge
          variant={isPlaying ? "default" : "secondary"}
          className="flex items-center gap-2 px-3 py-1"
        >
          {isPlaying ? (
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

        {isPlaying && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500 to-red-500"
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
                background: `linear-gradient(135deg, ${visualizerSettings.bgStartColor}, ${visualizerSettings.bgEndColor})`,
              }}
            >
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full h-auto max-w-[400px] max-h-[400px] mx-auto transition-all duration-300 group-hover:scale-[1.02]"
              />

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
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings Modal */}
      <VisualizerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={visualizerSettings}
        onSettingsChange={setVisualizerSettings}
      />
    </div>
  );
}
