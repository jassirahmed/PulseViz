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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

interface VisualizerSettings {
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
}

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
    },
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
    },
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
    },
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
    },
  },
};

const RESET_DEFAULTS = {
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
    const matchingPreset = Object.entries(PRESETS).find(([_, preset]) => {
      return JSON.stringify(preset.settings) === JSON.stringify(settings);
    });

    if (matchingPreset) {
      setActivePreset(matchingPreset[0]);
    } else {
      setActivePreset(null);
    }
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
      settings: settings,
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

  const uploadSettings = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.settings) {
          onSettingsChange({ ...settings, ...data.settings });
        }
      } catch (error) {
        console.error("Failed to parse settings file:", error);
      }
    };
    reader.readAsText(file);
  };

  const updateSetting = (key: keyof VisualizerSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
    setActivePreset(null);
  };

  const sliderGroups = [
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
          description: "Controls how many bars appear around the circle",
          tip: "More bars = smoother circle, fewer bars = more distinct segments",
        },
        {
          label: "Inner Circle Size",
          key: "radiusMultiplier" as keyof VisualizerSettings,
          min: 0.1,
          max: 0.5,
          step: 0.01,
          format: (v: number) => `${Math.round(v * 100)}%`,
          description: "Adjusts the size of the inner circle",
          tip: "Smaller values create a larger center space",
        },
        {
          label: "Base Bar Length",
          key: "barLength" as keyof VisualizerSettings,
          min: 5,
          max: 50,
          step: 1,
          description: "Minimum length of each bar when no audio is playing",
          tip: "This creates the baseline circle when music is quiet",
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
          description: "How responsive the bars are to audio changes",
          tip: "Higher values make bars react more dramatically to sound",
        },
        {
          label: "Maximum Bar Height",
          key: "maxBarHeight" as keyof VisualizerSettings,
          min: 5,
          max: 50,
          step: 1,
          description: "Maximum height bars can reach during loud audio",
          tip: "Prevents bars from becoming too large and overwhelming",
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
          description: "Thickness of each visualizer bar",
          tip: "Thicker lines are more visible but may overlap at high bar counts",
        },
        {
          label: "Glow Intensity",
          key: "shadowBlur" as keyof VisualizerSettings,
          min: 0,
          max: 30,
          step: 1,
          description: "Intensity of the glow effect around bars",
          tip: "Higher values create a more dramatic glow effect",
        },
      ],
    },
  ];

  const colorSettings = [
    {
      label: "Inner Gradient Color",
      key: "startColor" as keyof VisualizerSettings,
      description: "Color at the center of each bar",
      category: "Bar Colors",
    },
    {
      label: "Outer Gradient Color",
      key: "endColor" as keyof VisualizerSettings,
      description: "Color at the tips of each bar",
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
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
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
            <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
              <div className="flex items-center justify-between">
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
            </SheetHeader>

            <div className="p-6 flex-1 overflow-y-auto">
              <Tabs defaultValue="presets" className="w-full">
                <TabsList className="grid grid-cols-3 mb-6 w-full">
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

                <TabsContent value="controls" className="space-y-6">
                  {sliderGroups.map((group, groupIndex) => {
                    const IconComponent = group.icon;
                    return (
                      <motion.div
                        key={group.title}
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIndex * 0.1 }}
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
                                key={key}
                                className="space-y-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: groupIndex * 0.1 + settingIndex * 0.05,
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
                                      : settings[key]}
                                  </Badge>
                                </div>
                                <Slider
                                  value={[settings[key] as number]}
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
                                key={key}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay:
                                    categoryIndex * 0.1 + settingIndex * 0.05,
                                }}
                              >
                                <Card className="p-4 hover:shadow-sm transition-all duration-200">
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
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
                                            colorInputVisible === key
                                              ? null
                                              : key
                                          )
                                        }
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <Badge
                                          variant="outline"
                                          className="text-xs font-mono"
                                        >
                                          {settings[key] as string}
                                        </Badge>
                                        <motion.div
                                          className="w-8 h-8 rounded-md border-2 border-border shadow-sm cursor-pointer"
                                          style={{
                                            backgroundColor: settings[
                                              key
                                            ] as string,
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
                                              value={settings[key] as string}
                                              onChange={(e) =>
                                                updateSetting(
                                                  key,
                                                  e.target.value
                                                )
                                              }
                                              placeholder="Enter hex color (e.g., #ff0000)"
                                              className="flex-1 font-mono text-sm"
                                            />
                                            <input
                                              type="color"
                                              value={settings[key] as string}
                                              onChange={(e) =>
                                                updateSetting(
                                                  key,
                                                  e.target.value
                                                )
                                              }
                                              className="w-12 h-10 rounded-md cursor-pointer border border-border transition-all duration-200 hover:border-primary hover:scale-105"
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
