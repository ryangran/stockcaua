import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';

interface Particle {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const COUNT = 24;

export function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create particles
    particles.current = Array.from({ length: COUNT }, () => {
      const el = document.createElement('div');
      const size = Math.random() * 3 + 1;
      el.className = 'particle';
      el.style.cssText = `
        width:${size}px; height:${size}px;
        background: ${Math.random() > 0.5 ? 'var(--vs-orange)' : 'var(--vs-red)'};
        opacity: ${Math.random() * 0.3 + 0.05};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
      `;
      container.appendChild(el);
      return {
        el,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      };
    });

    // Float animation with GSAP
    particles.current.forEach((p) => {
      gsap.to(p.el, {
        y: `+=${(Math.random() - 0.5) * 60}`,
        x: `+=${(Math.random() - 0.5) * 40}`,
        duration: 6 + Math.random() * 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random() * 4,
      });
    });

    // Mouse parallax
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      particles.current.forEach((p, i) => {
        const depth = (i % 3 + 1) * 4;
        gsap.to(p.el, { x: `+=${dx * depth}`, y: `+=${dy * depth}`, duration: 1.5, ease: 'power1.out', overwrite: 'auto' });
      });
    };

    window.addEventListener('mousemove', onMove);

    return () => {
      window.removeEventListener('mousemove', onMove);
      particles.current.forEach((p) => p.el.remove());
      particles.current = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden
    />
  );
}
