import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';

const LINES = [
  '> Inicializando Visual Stands Design OS...',
  '> Conectando ao banco de dados...',
  '> Carregando módulos de estoque...',
  '> Sincronizando terminais...',
  '> Sistema pronto.',
];

export function BootScreen({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLParagraphElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete });

      // Logo entry
      tl.from('.boot-logo', { opacity: 0, scale: 0.8, duration: 0.6, ease: 'power3.out' })
        .from('.boot-bar', { scaleX: 0, duration: 0.5, ease: 'power2.inOut', transformOrigin: 'left' }, '+=0.2');

      // Stagger lines
      linesRef.current.forEach((el, i) => {
        tl.from(el, { opacity: 0, x: -10, duration: 0.2 }, `+=0.${i === 0 ? 3 : 2}`);
      });

      // Hold then exit
      tl.to(containerRef.current, { opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.4');
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: '#030303' }}
    >
      {/* Logo */}
      <div className="boot-logo mb-8 text-center">
        <div className="mb-1 text-4xl font-black tracking-tight" style={{ color: 'var(--vs-orange)' }}>
          VISUAL STANDS
        </div>
        <div className="text-sm font-light tracking-[0.4em] uppercase" style={{ color: 'var(--vs-muted)' }}>
          Design OS — Stock Control
        </div>
      </div>

      {/* Progress bar */}
      <div className="boot-bar mb-8 h-0.5 w-64 rounded-full" style={{ background: 'var(--vs-orange)' }} />

      {/* Terminal lines */}
      <div className="w-80 space-y-1 font-mono text-xs" style={{ color: 'var(--vs-muted)' }}>
        {LINES.map((line, i) => (
          <p
            key={i}
            ref={(el) => { if (el) linesRef.current[i] = el; }}
            style={{ color: i === LINES.length - 1 ? 'var(--vs-orange)' : undefined }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
