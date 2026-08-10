"use client";
import { useEffect, useRef, useState } from 'react';

type TickerHeartbeatProps = {
  assets: any[];
};

type FloatingTicker = {
  id: string;
  symbol: string;
  price: number;
  isUp: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pulseTimer: number;
  isPulsing: boolean;
  pulseFramesLeft: number;
};

export default function TickerHeartbeat({ assets }: TickerHeartbeatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const isVisible = useRef(true);
  const [mounted, setMounted] = useState(false);
  
  // Create static initial state for hydration
  const initialTickers = useRef<FloatingTicker[]>([]);

  useEffect(() => {
    setMounted(true);
    
    // Initialize tickers on client side only
    if (assets.length === 0) return;
    
    // Pick up to 40 random assets (15 on mobile)
    const count = Math.min(assets.length, window.innerWidth < 768 ? 15 : 40);
    const shuffled = [...assets].sort(() => 0.5 - Math.random());
    
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    initialTickers.current = shuffled.slice(0, count).map((a, i) => ({
      id: `${a.symbol}-${i}`,
      symbol: a.symbol,
      price: a.price,
      isUp: a.isUp,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      pulseTimer: Math.random() * 500, // random start time for pulsing
      isPulsing: false,
      pulseFramesLeft: 0
    }));

    let nodes: HTMLElement[] = [];
    requestAnimationFrame(() => {
      // Defer node query by one frame so React has time to render
      // We skip the first child because it's the <style> tag
      const allChildren = Array.from(containerRef.current?.children || []) as HTMLElement[];
      nodes = allChildren.filter(el => el.classList.contains('ticker-node'));
    });

    const animate = () => {
      if (!isVisible.current) {
        return;
      }
      
      const ww = window.innerWidth;
      const wh = window.innerHeight;

      initialTickers.current.forEach((t, i) => {
        t.x += t.vx;
        t.y += t.vy;

        // Wrap around screen
        if (t.x < -100) t.x = ww + 100;
        if (t.x > ww + 100) t.x = -100;
        if (t.y < -50) t.y = wh + 50;
        if (t.y > wh + 50) t.y = -50;

        // Client-side only glow trigger logic
        t.pulseTimer--;
        if (t.pulseTimer <= 0) {
          t.isPulsing = true;
          t.pulseTimer = 300 + Math.random() * 500; // Reset timer
          t.pulseFramesLeft = 60; // Let it pulse for 60 frames (1 second), computed once
        }

        if (t.isPulsing) {
          t.pulseFramesLeft--;
          if (t.pulseFramesLeft <= 0) {
            t.isPulsing = false;
          }
        }

        // Apply transforms via DOM for performance (bypassing React state)
        if (nodes[i]) {
          nodes[i].style.transform = `translate3d(${t.x}px, ${t.y}px, 0)`;
          
          if (t.isPulsing) {
            nodes[i].classList.add('animate-pulse-glow');
            nodes[i].classList.add(t.isUp ? 'glow-green' : 'glow-red');
          } else {
            nodes[i].classList.remove('animate-pulse-glow', 'glow-green', 'glow-red');
          }
        }
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    // Setup Intersection Observer to pause animation off-screen
    const observer = new IntersectionObserver((entries) => {
      const isIntersecting = entries[0].isIntersecting;
      if (isIntersecting && !isVisible.current) {
        isVisible.current = true;
        requestRef.current = requestAnimationFrame(animate);
      } else {
        isVisible.current = isIntersecting;
      }
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(requestRef.current);
      observer.disconnect();
    };
  }, [assets]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <style dangerouslySetInnerHTML={{__html: `
        .ticker-node {
          position: absolute;
          top: 0;
          left: 0;
          will-change: transform;
          opacity: 0.15;
          transition: opacity 0.3s ease, text-shadow 0.3s ease;
          font-family: monospace;
          font-weight: 700;
          font-size: 0.85rem;
          color: white;
          user-select: none;
        }
        .animate-pulse-glow {
          opacity: 0.6;
        }
        .glow-green {
          color: #34d399; /* emerald-400 */
          text-shadow: 0 0 15px rgba(52, 211, 153, 0.6), 0 0 30px rgba(52, 211, 153, 0.3);
        }
        .glow-red {
          color: #fb7185; /* rose-400 */
          text-shadow: 0 0 15px rgba(251, 113, 133, 0.6), 0 0 30px rgba(251, 113, 133, 0.3);
        }
      `}} />
      
      {/* We render the nodes statically in React, then animate them directly via DOM for 60fps performance */}
      {mounted && initialTickers.current.map((t) => (
        <div key={t.id} className="ticker-node">
          {t.symbol}
        </div>
      ))}
    </div>
  );
}
