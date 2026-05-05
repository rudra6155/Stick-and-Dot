"use client";
import { useEffect, useRef } from 'react';

export default function DollarParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    class Particle {
      x: number;
      y: number;
      size: number;
      baseX: number;
      speedY: number;
      angle: number;
      angleSpeed: number;
      driftSeed: number;

      constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.baseX = this.x;
        this.size = Math.random() * 36 + 12; // 12px to 48px
        this.speedY = Math.random() * 0.5 + 0.2;
        this.angle = Math.random() * Math.PI * 2;
        this.angleSpeed = (Math.random() - 0.5) * 0.02;
        this.driftSeed = Math.random() * Math.PI * 2;
      }

      update(time: number) {
        this.y -= this.speedY;
        if (this.y < -50) {
          this.y = window.innerHeight + 50;
          this.x = Math.random() * window.innerWidth;
          this.baseX = this.x;
        }

        // Horizontal drift
        this.x = this.baseX + Math.sin(time * 0.001 + this.driftSeed) * 50;
        this.angle += this.angleSpeed;

        // Mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200) {
          const force = (200 - dist) / 200;
          this.x += dx * force * 0.02;
          this.y += dy * force * 0.02;
        } else {
          // drift back towards baseline slowly
          this.x += (this.baseX + Math.sin(time * 0.001 + this.driftSeed) * 50 - this.x) * 0.01;
        }

        // Opacity oscillation
        const opacity = 0.05 + Math.cos(time * 0.001 + this.driftSeed) * 0.03; // 0.02 to 0.08
        
        if (ctx) {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.angle);
          ctx.fillStyle = `rgba(16, 185, 129, ${opacity})`;
          ctx.font = `${this.size}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);
          ctx.restore();
        }
      }
    }

    for (let i = 0; i < 30; i++) {
      particles.push(new Particle());
    }

    const render = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => p.update(time));
      animationFrameId = requestAnimationFrame(render);
    };
    render(0);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
