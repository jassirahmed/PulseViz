"use client";

import type React from "react";

import {
  Eye,
  Info,
  Lightbulb,
  Minimize2,
  Palette,
  RefreshCcw,
  Settings2,
  Sliders,
  Sparkles,
  Waves,
  Zap,
  Download,
  Upload,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ColorPickerButton } from "./ColorPickerButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { VisualizerSettings } from "@/components/visualizer-instance";

interface VisualizerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VisualizerSettings;
  onSettingsChange: (settings: VisualizerSettings) => void;
}

const PRESETS = {
  calm: {
    name: "Calm Waves",
    description: "Smooth, gentle visualization perfect for relaxation",
    icon: Waves,
    gradient: "from-sky-500 to-cyan-500",
    hoverGradient: "from-sky-400 to-cyan-400",
    settings: {
      bars: 48,
      barLength: 10,
      radiusMultiplier: 0.35,
      sensitivity: 1.5,
      maxBarHeight: 25,
      fftSize: 512,
      lineWidth: 3,
      shadowBlur: 10,
      startColor: "#0ea5e9",
      endColor: "#06b6d4",
      bgStartColor: "#0c4a6e",
      bgEndColor: "#0f172a",
      // new
      shape: "waveform",
      rotationSpeed: 0,
      barSpacing: 4,
      opacity: 0.95,
      glowColor: null,
      dynamicColors: false,
      rainbowMode: false,
      showPeaks: false,
      animateBackground: true,
    } as VisualizerSettings,
  },
  energetic: {
    name: "Energetic Pulse",
    description: "Dynamic, responsive bars for high-energy music",
    icon: Zap,
    gradient: "from-pink-500 to-violet-500",
    hoverGradient: "from-pink-400 to-violet-400",
    settings: {
      bars: 72,
      barLength: 10,
      radiusMultiplier: 0.25,
      sensitivity: 2.5,
      maxBarHeight: 30,
      fftSize: 512,
      lineWidth: 4,
      shadowBlur: 20,
      startColor: "#ec4899",
      endColor: "#8b5cf6",
      bgStartColor: "#4c1d95",
      bgEndColor: "#000000",
      // new
      shape: "bars",
      rotationSpeed: 0,
      barSpacing: 6,
      opacity: 1,
      glowColor: "#ff00aa",
      dynamicColors: true,
      rainbowMode: false,
      showPeaks: true,
      animateBackground: true,
    } as VisualizerSettings,
  },
  minimal: {
    name: "Minimal Style",
    description: "Clean, subtle design with understated elegance",
    icon: Minimize2,
    gradient: "from-slate-500 to-slate-400",
    hoverGradient: "from-slate-400 to-slate-300",
    settings: {
      bars: 36,
      barLength: 10,
      radiusMultiplier: 0.4,
      sensitivity: 1.2,
      maxBarHeight: 15,
      fftSize: 512,
      lineWidth: 2,
      shadowBlur: 5,
      startColor: "#64748b",
      endColor: "#94a3b8",
      bgStartColor: "#1e293b",
      bgEndColor: "#0f172a",
      // new
      shape: "bars",
      rotationSpeed: 0,
      barSpacing: 8,
      opacity: 0.9,
      glowColor: null,
      dynamicColors: false,
      rainbowMode: false,
      showPeaks: false,
      animateBackground: false,
    } as VisualizerSettings,
  },
  neon: {
    name: "Neon Glow",
    description: "Bright, glowing effects with vibrant colors",
    icon: Lightbulb,
    gradient: "from-green-400 to-pink-500",
    hoverGradient: "from-green-300 to-pink-400",
    settings: {
      bars: 60,
      barLength: 12,
      radiusMultiplier: 0.3,
      sensitivity: 2.2,
      maxBarHeight: 28,
      fftSize: 512,
      lineWidth: 5,
      shadowBlur: 25,
      startColor: "#00ff88",
      endColor: "#ff0088",
      bgStartColor: "#001122",
      bgEndColor: "#000000",
      // new
      shape: "dots",
      rotationSpeed: 0,
      barSpacing: 5,
      opacity: 1,
      glowColor: "#00ffaa",
      dynamicColors: true,
      rainbowMode: true,
      showPeaks: true,
      animateBackground: true,
    } as VisualizerSettings,
  },
};

const RESET_DEFAULTS: VisualizerSettings = {
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
  // new
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
type SliderSetting = {
  label: string;
  key: keyof VisualizerSettings;
  min: number;
  max: number;
  step: number;
  description?: string;
  tip?: string;
  format?: (value: number) => string;
};

// 🗂 Group of sliders
type SliderGroup = {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; // better typing for Lucide icons
  settings: SliderSetting[];
};
export default function VisualizerSettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: VisualizerSettingsModalProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [colorInputVisible, setColorInputVisible] = useState<string | null>(
    null
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const matchingPreset = Object.entries(PRESETS).find(([_, preset]) => {
      return JSON.stringify(preset.settings) === JSON.stringify(settings);
    });
    if (matchingPreset) setActivePreset(matchingPreset[0]);
    else setActivePreset(null);
  }, [settings]);

  const applyPreset = (presetName: keyof typeof PRESETS) => {
    const preset = PRESETS[presetName];
    onSettingsChange({ ...settings, ...preset.settings });
    setActivePreset(presetName);
  };

  const resetToDefaults = () => {
    onSettingsChange(RESET_DEFAULTS);
    setActivePreset(null);
  };

  const downloadSettings = () => {
    const settingsData = {
      name: "Custom Visualizer Settings",
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

  const uploadSettings = () => fileInputRef.current?.click();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.settings) onSettingsChange({ ...settings, ...data.settings });
      } catch (error) {
        console.error("Failed to parse settings file:", error);
      }
    };
    reader.readAsText(file);
  };

  const updateSetting = (
    key: keyof VisualizerSettings,
    value: number | string | boolean | null | undefined
  ) => {
    onSettingsChange({ ...settings, [key]: value });
    setActivePreset(null);
  };

  const sliderGroups: SliderGroup[] = [
    {
      title: "Structure & Layout",
      icon: Settings2,
      settings: [
        {
          label: "Number of Bars",
          key: "bars" as keyof VisualizerSettings,
          min: 12,
          max: 120,
          step: 4,
          description: "How many segments around the circle",
          tip: "More bars = smoother ring, fewer bars = bolder shapes",
        },
        {
          label: "Inner Circle Size",
          key: "radiusMultiplier" as keyof VisualizerSettings,
          min: 0.1,
          max: 0.5,
          step: 0.01,
          format: (v: number) => `${Math.round(v * 100)}%`,
          description: "Size of the inner ring",
          tip: "Smaller values create more center space",
        },
        {
          label: "Base Bar Length",
          key: "barLength" as keyof VisualizerSettings,
          min: 5,
          max: 50,
          step: 1,
          description: "Minimum length when audio is quiet",
          tip: "Controls the baseline circle thickness",
        },
        {
          label: "Bar Gap",
          key: "barSpacing" as keyof VisualizerSettings,
          min: 0,
          max: 20,
          step: 1,
          format: (v: number) => `${v.toFixed(0)}px`,
          description: "Gap between inner ring and visuals",
          tip: "Creates a small inner space before bars/dots start",
        },
      ],
    },
    {
      title: "Audio Response",
      icon: Waves,
      settings: [
        {
          label: "Audio Sensitivity",
          key: "sensitivity" as keyof VisualizerSettings,
          min: 0.5,
          max: 5,
          step: 0.1,
          format: (v: number) => `${v.toFixed(1)}x`,
          description: "How strongly visuals react to sound",
          tip: "Higher values increase movement",
        },
        {
          label: "Maximum Bar Height",
          key: "maxBarHeight" as keyof VisualizerSettings,
          min: 5,
          max: 50,
          step: 1,
          description: "Ceiling for bar length",
          tip: "Prevents visuals from overwhelming the canvas",
        },
        {
          label: "FFT Size",
          key: "fftSize" as keyof VisualizerSettings,
          min: 256,
          max: 2048,
          step: 256,
          description: "Frequency resolution (higher = smoother)",
          tip: "Requires more CPU at higher values",
        },
      ],
    },
    {
      title: "Visual Effects",
      icon: Sparkles,
      settings: [
        {
          label: "Line Thickness",
          key: "lineWidth" as keyof VisualizerSettings,
          min: 1,
          max: 10,
          step: 0.5,
          format: (v: number) => `${v.toFixed(1)}px`,
          description: "Thickness of bars and outlines",
          tip: "Thicker lines are more visible but can overlap",
        },
        {
          label: "Glow Intensity",
          key: "shadowBlur" as keyof VisualizerSettings,
          min: 0,
          max: 30,
          step: 1,
          description: "Soft glow around visuals",
          tip: "Higher values give a neon effect",
        },
        {
          label: "Opacity",
          key: "opacity" as keyof VisualizerSettings,
          min: 0.2,
          max: 1,
          step: 0.05,
          format: (v: number) => `${Math.round(v * 100)}%`,
          description: "Overall visual opacity",
          tip: "Lower opacity blends visuals with the background",
        },
        {
          label: "Rotation Speed",
          key: "rotationSpeed" as keyof VisualizerSettings,
          min: 0,
          max: 1,
          step: 0.01,
          format: (v: number) => `${(v * 60).toFixed(0)}°/s`,
          description: "Automatic rotation",
          tip: "0 = stationary, 1 ≈ 1 rev/sec",
        },
      ],
    },
  ] as const;

  const colorSettings = [
    {
      label: "Inner Gradient Color",
      key: "startColor" as keyof VisualizerSettings,
      description: "Color at the base",
      category: "Bar Colors",
    },
    {
      label: "Outer Gradient Color",
      key: "endColor" as keyof VisualizerSettings,
      description: "Color at the tips",
      category: "Bar Colors",
    },
    {
      label: "Glow Color",
      key: "glowColor" as keyof VisualizerSettings,
      description: "Overrides the glow color (optional)",
      category: "Bar Colors",
    },
    {
      label: "Background Top Color",
      key: "bgStartColor" as keyof VisualizerSettings,
      description: "Top color of the background gradient",
      category: "Background",
    },
    {
      label: "Background Bottom Color",
      key: "bgEndColor" as keyof VisualizerSettings,
      description: "Bottom color of the background gradient",
      category: "Background",
    },
  ];

  const groupedColorSettings = colorSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, typeof colorSettings>);

  return (
    <TooltipProvider>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-[400px] sm:w-[500px] p-0
             [&>div:first-child]:bg-transparent
             [&>div:first-child]:backdrop-blur-none
             [&[data-state=open]>~div]:bg-transparent"
        >
          <motion.div
            className="flex flex-col h-full"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sliders className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </motion.div>
                <div>
                  <SheetTitle className="text-lg font-semibold">
                    Visualizer Settings
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    Customize your audio visualizer experience
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={uploadSettings}
                      className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer transition-all duration-200 hover:scale-105"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upload settings</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={downloadSettings}
                      className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer transition-all duration-200 hover:scale-105"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download settings</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <Tabs defaultValue="presets" className="w-full">
                <TabsList className="grid grid-cols-4 mb-6 w-full">
                  <TabsTrigger
                    value="presets"
                    className="flex items-center gap-2 text-xs transition-all duration-200 cursor-pointer hover:scale-105"
                  >
                    <Sparkles className="h-3 w-3" />
                    Presets
                  </TabsTrigger>
                  <TabsTrigger
                    value="controls"
                    className="flex items-center gap-2 text-xs transition-all duration-200 cursor-pointer hover:scale-105"
                  >
                    <Sliders className="h-3 w-3" />
                    Controls
                  </TabsTrigger>
                  <TabsTrigger
                    value="colors"
                    className="flex items-center gap-2 text-xs transition-all duration-200 cursor-pointer hover:scale-105"
                  >
                    <Palette className="h-3 w-3" />
                    Colors
                  </TabsTrigger>
                  <TabsTrigger
                    value="effects"
                    className="flex items-center gap-2 text-xs transition-all duration-200 cursor-pointer hover:scale-105"
                  >
                    <Lightbulb className="h-3 w-3" />
                    Effects
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="presets" className="space-y-4">
                  <div className="space-y-3">
                    {Object.entries(PRESETS).map(([key, preset], index) => {
                      const IconComponent = preset.icon;
                      const isActive = activePreset === key;

                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card
                            className={`p-0 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                              isActive
                                ? "ring-2 ring-primary shadow-md"
                                : "hover:shadow-sm"
                            }`}
                            onClick={() =>
                              applyPreset(key as keyof typeof PRESETS)
                            }
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <motion.div
                                  className={`p-2 rounded-lg bg-gradient-to-r ${preset.gradient} text-white`}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <IconComponent className="h-4 w-4" />
                                </motion.div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium">
                                      {preset.name}
                                    </h3>
                                    <AnimatePresence>
                                      {isActive && (
                                        <motion.div
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          exit={{ scale: 0, opacity: 0 }}
                                        >
                                          <Badge
                                            variant="default"
                                            className="text-xs"
                                          >
                                            Active
                                          </Badge>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {preset.description}
                                  </p>
                                </div>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  <Separator className="my-6" />

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      onClick={resetToDefaults}
                      className="w-full hover:bg-slate-50 dark:hover:bg-slate-950/30 transition-all duration-200 bg-transparent cursor-pointer"
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Reset to Default Settings
                    </Button>
                  </motion.div>
                </TabsContent>

                {/* Controls: include shape selection at top */}
                <TabsContent value="controls" className="space-y-6">
                  <Card className="p-4">
                    <Label className="text-sm font-medium mb-2 block">
                      Shape
                    </Label>
                    <Select
                      value={(settings.shape || "bars") as string}
                      onValueChange={(v) => {
                        if (v) {
                          updateSetting(
                            "shape",
                            v as VisualizerSettings["shape"]
                          );
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a shape" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bars">Bars</SelectItem>
                        <SelectItem value="dots">Dots</SelectItem>
                        <SelectItem value="waveform">Waveform</SelectItem>
                        <SelectItem value="polygon">Polygon</SelectItem>
                      </SelectContent>
                    </Select>
                  </Card>

                  {sliderGroups.map((group, groupIndex) => {
                    const IconComponent = group.icon;
                    return (
                      <motion.div
                        key={group.title}
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIndex * 0.05 }}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <IconComponent className="h-4 w-4 text-primary" />
                          <h3 className="font-medium text-sm">{group.title}</h3>
                        </div>

                        <div className="space-y-6 pl-6 border-l-2 border-muted">
                          {group.settings.map(
                            (
                              {
                                label,
                                key,
                                min,
                                max,
                                step,
                                format,
                                description,
                                tip,
                              },
                              settingIndex
                            ) => (
                              <motion.div
                                key={String(key)}
                                className="space-y-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay:
                                    groupIndex * 0.05 + settingIndex * 0.03,
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm font-medium">
                                        {label}
                                      </Label>
                                      <Tooltip>
                                        <TooltipTrigger className="cursor-pointer">
                                          <Info className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors duration-200" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="max-w-xs text-xs">
                                            {tip}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {description}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-mono"
                                  >
                                    {format
                                      ? format(settings[key] as number)
                                      : (settings[key] as string)}
                                  </Badge>
                                </div>
                                <Slider
                                  value={[Number(settings[key])]}
                                  min={min}
                                  max={max}
                                  step={step}
                                  onValueChange={(vals) =>
                                    updateSetting(key, vals[0])
                                  }
                                  className="cursor-pointer [&_[role=slider]]:cursor-pointer [&_[role=slider]]:transition-all [&_[role=slider]]:duration-200 [&_[role=slider]]:hover:scale-110"
                                />
                              </motion.div>
                            )
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </TabsContent>

                {/* Colors (add glowColor control) */}
                <TabsContent value="colors" className="space-y-6">
                  {Object.entries(groupedColorSettings).map(
                    ([category, categorySettings], categoryIndex) => (
                      <motion.div
                        key={category}
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: categoryIndex * 0.1 }}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <Palette className="h-4 w-4 text-primary" />
                          <h3 className="font-medium text-sm">{category}</h3>
                        </div>

                        <div className="space-y-4 pl-6 border-l-2 border-muted">
                          {categorySettings.map(
                            ({ label, key, description }, settingIndex) => (
                              <motion.div
                                key={String(key)}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay:
                                    categoryIndex * 0.1 + settingIndex * 0.05,
                                }}
                              >
                                <Card className="p-4 hover:shadow-sm transition-all duration-200">
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-sm font-medium">
                                          {label}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                          {description}
                                        </p>
                                      </div>
                                      <motion.button
                                        className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-all duration-200"
                                        onClick={() =>
                                          setColorInputVisible(
                                            colorInputVisible ===
                                              (key as string)
                                              ? null
                                              : (key as string)
                                          )
                                        }
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <Badge
                                          variant="outline"
                                          className="text-xs font-mono"
                                        >
                                          {(settings[key] as string) ?? "none"}
                                        </Badge>
                                        <motion.div
                                          className="w-8 h-8 rounded-md border-2 border-border shadow-sm cursor-pointer"
                                          style={{
                                            backgroundColor:
                                              (settings[key] as string) ||
                                              "transparent",
                                          }}
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.95 }}
                                        />
                                      </motion.button>
                                    </div>

                                    <AnimatePresence>
                                      {colorInputVisible === key && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{
                                            opacity: 1,
                                            height: "auto",
                                          }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="space-y-3"
                                        >
                                          <div className="flex gap-2">
                                            <Input
                                              type="text"
                                              value={
                                                (settings[key] as string) ?? ""
                                              }
                                              onChange={(e) =>
                                                updateSetting(
                                                  key,
                                                  e.target.value || null
                                                )
                                              }
                                              placeholder="Enter hex color (e.g., #ff0000) or leave empty"
                                              className="h-10 flex-1 font-mono text-sm"
                                            />
                                            <ColorPickerButton
                                              value={
                                                (settings[key] as string) ??
                                                "#ffffff"
                                              }
                                              onChange={(color) =>
                                                updateSetting(key, color)
                                              }
                                            />
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </Card>
                              </motion.div>
                            )
                          )}
                        </div>
                      </motion.div>
                    )
                  )}
                </TabsContent>

                {/* Effects tab with toggles */}
                <TabsContent value="effects" className="space-y-4">
                  <Card className="p-4">
                    <div className="space-y-4">
                      {[
                        {
                          key: "dynamicColors" as const,
                          label: "Dynamic Colors",
                          desc: "Blend colors based on audio intensity",
                        },
                        {
                          key: "rainbowMode" as const,
                          label: "Rainbow Mode",
                          desc: "Cycle hues across the ring",
                        },
                        {
                          key: "showPeaks" as const,
                          label: "Show Peaks",
                          desc: "Display peak markers with gentle decay",
                        },
                        {
                          key: "animateBackground" as const,
                          label: "Animated Background",
                          desc: "Subtle background gradient animation",
                        },
                      ].map(({ key, label, desc }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <div className="pr-4">
                            <Label className="text-sm font-medium">
                              {label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {desc}
                            </p>
                          </div>
                          <Switch
                            checked={Boolean(settings[key])}
                            onCheckedChange={(v) => updateSetting(key, v)}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Separator className="my-4" />

                  <Button
                    variant="outline"
                    onClick={resetToDefaults}
                    className="w-full bg-transparent"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Reset to Default Settings
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </SheetContent>
      </Sheet>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
      />
    </TooltipProvider>
  );
}
