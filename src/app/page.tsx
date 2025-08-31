"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/ThemeToggle";
import VisualizerSettingsModal from "@/components/VisualizerSettingsModal";
import {
  VisualizerInstance,
  type VisualizerSettings,
} from "@/components/visualizer-instance";
import { useSharedMic } from "@/hooks/use-shared-mic";

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

export default function VisualizerLabPage() {
  const {
    audioContext,
    isMuted,
    toggleMute,
    permissionError,
    createAnalyser,
    start,
  } = useSharedMic({
    autoStart: true,
  });

  // number of instances (1..4)
  const [count, setCount] = useState<number>(2);
  const [settingsList, setSettingsList] = useState<VisualizerSettings[]>(
    Array.from({ length: 2 }, () => ({ ...DEFAULT_SETTINGS }))
  );

  // modal state for editing one instance at a time
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // ensure settingsList always matches count
  useEffect(() => {
    setSettingsList((prev) => {
      const copy = [...prev];
      if (copy.length < count) {
        while (copy.length < count) copy.push({ ...DEFAULT_SETTINGS });
      } else if (copy.length > count) {
        copy.length = count;
      }
      return copy;
    });
  }, [count]);

  const analysers = useMemo(() => {
    if (!audioContext)
      return Array.from({ length: count }, () => null as AnalyserNode | null);

    return Array.from({ length: count }, () =>
      createAnalyser({ fftSize: DEFAULT_SETTINGS.fftSize, smoothing: 0.75 })
    );
  }, [audioContext, count, createAnalyser]);

  const handleCopySettings = () => {
    toast("Settings copied", {
      description: "Visualizer settings JSON copied to clipboard.",
    });
  };

  const micStatusLabel = permissionError
    ? "Mic blocked"
    : isMuted
    ? "Muted"
    : "Live";
  const micStatusVariant =
    !permissionError && !isMuted ? "default" : "secondary";

  return (
    <div
      className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-100 via-white to-purple-100
                 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-all duration-700 ease-in-out relative"
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="
    flex flex-col gap-4 w-full px-4 pt-4
    md:flex-row md:items-center md:justify-between md:gap-6 md:px-6 md:pt-6
  "
      >
        {/* Left: Title + Description */}
        <div className="space-y-1 text-center md:text-left">
          <h1
            className="text-2xl md:text-3xl font-bold tracking-tight 
                   bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent 
                   dark:from-cyan-400 dark:to-blue-500"
          >
            Pulse Visualizer Lab
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Compare up to 4 instances, each with different settings. Click any
            visualizer to copy its settings JSON.
          </p>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
          {/* Mic Status */}
          <motion.div
            animate={{
              scale: micStatusLabel === "Live" ? [1, 1.05, 1] : 1,
              opacity: permissionError ? [1, 0.7, 1] : 1,
            }}
            transition={{
              duration: 1.5,
              repeat:
                micStatusLabel === "Live" || permissionError ? Infinity : 0,
            }}
          >
            <Badge className="text-xs md:text-sm" variant={micStatusVariant}>
              {micStatusLabel}
            </Badge>
          </motion.div>

          {/* Mic Button */}
          {permissionError ? (
            <Button
              onClick={() => start()}
              variant="destructive"
              size="sm"
              className="rounded-full shadow-sm text-xs px-3 py-1 md:px-4 md:py-2"
            >
              Enable mic
            </Button>
          ) : (
            <Button
              onClick={() => toggleMute()}
              variant="outline"
              size="sm"
              className="cursor-pointer text-xs px-3 py-1 md:px-4 md:py-2"
            >
              {isMuted ? (
                <MicOff className="h-4 w-4 mr-1" />
              ) : (
                <Mic className="h-4 w-4 mr-1" />
              )}
              {isMuted ? "Unmute" : "Mute"}
            </Button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </motion.div>

      <Separator className="my-6" />

      <main className="w-full max-w-6xl px-4 md:px-8 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-muted-foreground">Instances:</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <Button
                key={n}
                size="sm"
                variant={count === n ? "default" : "outline"}
                onClick={() => setCount(n)}
                className="cursor-pointer"
              >
                {n}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <VisualizerInstance
              key={i} // ✅ Add key here
              analyser={analysers[i] || null}
              isMuted={!!isMuted || !!permissionError}
              settings={settingsList[i]}
              onOpenSettings={() => setActiveIndex(i)}
              onCopySettings={handleCopySettings}
            />
          ))}
        </div>
      </main>

      {/* Shared settings modal bound to the currently selected instance */}
      {activeIndex !== null && (
        <VisualizerSettingsModal
          isOpen={activeIndex !== null}
          onClose={() => setActiveIndex(null)}
          settings={settingsList[activeIndex]}
          onSettingsChange={(next) =>
            setSettingsList((prev) => {
              const copy = [...prev];
              copy[activeIndex] = next;
              return copy;
            })
          }
        />
      )}
    </div>
  );
}
