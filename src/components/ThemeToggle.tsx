"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [ripple, setRipple] = useState(false);

  const toggleTheme = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 500);
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="relative"
    >
      {/* Ripple on click */}
      {ripple && (
        <motion.span
          key="ripple"
          className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/20"
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}

      {/* Glow background */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl opacity-50"
        animate={{
          background:
            theme === "light"
              ? "radial-gradient(circle, rgba(255,223,128,0.5) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(100,149,237,0.5) 0%, transparent 70%)",
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={toggleTheme}
        className="relative z-10 h-9 w-9 md:h-11 md:w-11 rounded-full 
             bg-white/20 backdrop-blur-md border-white/30 
             hover:bg-white/30 text-black dark:text-white 
             shadow-md transition-all duration-500"
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === "light" ? (
            <motion.span
              key="sun"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <Sun className="h-5 w-5 text-yellow-400 drop-shadow" />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <Moon className="h-5 w-5 text-blue-400 drop-shadow" />
            </motion.span>
          )}
        </AnimatePresence>
        <span className="sr-only">Toggle theme</span>
      </Button>
    </motion.div>
  );
}
