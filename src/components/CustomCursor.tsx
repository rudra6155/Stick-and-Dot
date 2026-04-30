"use client";
import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isClient, setIsClient] = useState(false);
  const cursorX = useSpring(0, { stiffness: 300, damping: 20 });
  const cursorY = useSpring(0, { stiffness: 300, damping: 20 });

  useEffect(() => {
    setIsClient(true);
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16); // offset by half size to center
      cursorY.set(e.clientY - 16);
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  if (!isClient) return null;

  return (
    <motion.div
      style={{
        translateX: cursorX,
        translateY: cursorY,
      }}
      className="fixed top-0 left-0 w-8 h-8 rounded-full border border-white/50 bg-white/20 backdrop-blur-sm pointer-events-none z-[100] shadow-[0_0_15px_rgba(255,255,255,0.6)] mix-blend-difference"
    />
  );
}
