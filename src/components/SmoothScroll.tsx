"use client";
import { ReactLenis, useLenis } from 'lenis/react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

function RouteScrollHandler() {
  const lenis = useLenis();
  const pathname = usePathname();

  useEffect(() => {
    if (!lenis) return;
    lenis.scrollTo(0, { immediate: true });
    lenis.resize();
  }, [lenis, pathname]);

  return null;
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true, syncTouch: false, autoResize: true }}>
      <RouteScrollHandler />
      {children}
    </ReactLenis>
  );
}
