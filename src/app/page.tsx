"use client";

import { Fragment } from "react";
import AudioVisualizer from "@/components/AudioVisualizer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";

export default function GenUIVoiceModel() {
  return (
    <Fragment>
      <div
        data-lk-theme="default"
        className="min-h-screen flex flex-col items-center justify-center
                   bg-gradient-to-br from-indigo-100 via-white to-purple-100
                   dark:from-gray-900 dark:via-gray-800 dark:to-black
                   transition-all duration-700 ease-in-out relative"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 right-6 z-10"
        >
          <ThemeToggle />
        </motion.div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"
          />
        </div>

        <AudioVisualizer />
      </div>
    </Fragment>
  );
}
