import { useState, useRef, useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { gsap } from '../../lib/gsap';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ParticleBackground } from '../shared/ParticleBackground';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const contentRef = useRef<HTMLDivElement>(null);

  // Page transition on route change
  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 12, z: -30 },
      { opacity: 1, y: 0, z: 0, duration: 0.35, ease: 'power2.out' }
    );
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-background)' }}>
      <ParticleBackground />

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex flex-1 flex-col overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        <TopBar pathname={pathname} />

        <main
          ref={contentRef}
          className="flex-1 overflow-y-auto p-6"
          style={{ perspective: '1000px' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
