"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { motion, useSpring, AnimatePresence } from "framer-motion";

type CursorState = 'default' | 'profit' | 'loss';

interface CursorContextType {
  cursorState: CursorState;
  setCursorState: (state: CursorState) => void;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export const useCursor = () => {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error("useCursor must be used within a CursorProvider");
  }
  return context;
};

export const CursorProvider = ({ children }: { children: ReactNode }) => {
  const [cursorState, setCursorState] = useState<CursorState>('default');

  return (
    <CursorContext.Provider value={{ cursorState, setCursorState }}>
      {children}
      <CustomCursor />
    </CursorContext.Provider>
  );
};

interface Particle {
  id: number;
  x: number;
  y: number;
}

function CustomCursor() {
  const [isTouchDevice, setIsTouchDevice] = useState(true);
  const { cursorState } = useCursor();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [particleCounter, setParticleCounter] = useState(0);

  // Smooth springs for cursor position
  const cursorX = useSpring(0, { stiffness: 400, damping: 25 });
  const cursorY = useSpring(0, { stiffness: 400, damping: 25 });

  useEffect(() => {
    const isTouch = window.matchMedia('(hover: none)').matches;
    setIsTouchDevice(isTouch);

    if (isTouch) return;

    const moveCursor = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  // Particle spawner
  useEffect(() => {
    if (cursorState === 'default' || isTouchDevice) {
      setParticles([]);
      return;
    }

    const spawnInterval = setInterval(() => {
      setParticles(prev => {
        const newParticle = {
          id: particleCounter,
          x: mousePosition.x + (Math.random() * 40 - 20),
          y: mousePosition.y + (Math.random() * 40 - 20)
        };
        setParticleCounter(c => c + 1);
        const updated = [...prev, newParticle];
        if (updated.length > 5) updated.shift();
        return updated;
      });
    }, 800);

    return () => clearInterval(spawnInterval);
  }, [cursorState, mousePosition, particleCounter, isTouchDevice]);

  if (isTouchDevice) return null;

  const isProfit = cursorState === 'profit';
  const isLoss = cursorState === 'loss';
  const isHovering = isProfit || isLoss;

  const ringColor = isProfit ? 'rgba(16,185,129,0.5)' : isLoss ? 'rgba(248,68,94,0.5)' : 'rgba(255,255,255,0.3)';
  const textColor = isProfit ? '#10b981' : isLoss ? '#f43f5e' : '#ffffff';
  const textShadow = isProfit 
    ? '0 0 20px rgba(16,185,129,0.9), 0 0 40px rgba(16,185,129,0.4)' 
    : isLoss 
    ? '0 0 20px rgba(248,68,94,0.9), 0 0 40px rgba(248,68,94,0.4)'
    : '0 0 12px rgba(255,255,255,0.6)';

  return (
    <div className="pointer-events-none fixed top-0 left-0 w-full h-full z-[9999] overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 flex items-center justify-center will-change-transform"
        style={{ x: cursorX, y: cursorY, translateX: '-50%', translateY: '-50%' }}
      >
        <motion.div
          animate={{
            width: isHovering ? 56 : 36,
            height: isHovering ? 56 : 36,
            borderColor: isHovering ? 'transparent' : ringColor,
            boxShadow: isHovering ? `0 0 20px ${ringColor}` : 'none',
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute rounded-full border border-solid border-white/30"
        />
        <motion.div
          animate={{
            color: textColor,
            textShadow: textShadow,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="font-mono font-bold text-[20px] relative z-10 select-none flex items-center justify-center mt-0.5 ml-0.5"
        >
          $
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, x: p.x, y: p.y, scale: 0.5 }}
            animate={{ 
              opacity: 0, 
              y: p.y + (isProfit ? -20 : 20),
              scale: 1 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute pointer-events-none font-mono font-bold text-sm"
            style={{ 
              color: isProfit ? '#10b981' : '#f43f5e',
              textShadow: isProfit ? '0 0 8px rgba(16,185,129,0.6)' : '0 0 8px rgba(248,68,94,0.6)'
            }}
          >
            {isProfit ? '+' : '-'}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
