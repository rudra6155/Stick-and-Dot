"use client";
import { ReactLenis, useLenis } from 'lenis/react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/dist/ScrollTrigger';
import { useEffect } from 'react';

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Sync GSAP's ticker with requestAnimationFrame (fixes jumpy scroll on some setups)
    gsap.ticker.lagSmoothing(0);
  }, []);

  useLenis((lenis) => {
    ScrollTrigger.update();
  });

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true, syncTouch: false }}>
      {children}
    </ReactLenis>
  );
}
