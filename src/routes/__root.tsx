import { useEffect, useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { gsap } from '../lib/gsap';
import { createLenis, destroyLenis } from '../lib/lenis';
import { useStockStore } from '../store/useStockStore';
import { useAuthStore } from '../store/useAuthStore';
import { useRealtime } from '../hooks/useRealtime';
import { usePresence } from '../hooks/usePresence';
import { useKonamiCode } from '../hooks/useKonamiCode';
import { AppLayout } from '../components/layout/AppLayout';
import { BootScreen } from '../components/shared/BootScreen';
import { LoginScreen } from '../components/shared/LoginScreen';
import { RegistroScreen } from '../components/shared/RegistroScreen';

import appCss from '../styles.css?url';

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold" style={{ color: 'var(--vs-orange)' }}>404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--vs-muted)' }}>
          A página que você está procurando não existe.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--vs-orange)', color: '#000' }}
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--vs-red)' }}>Algo deu errado</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--vs-muted)' }}>{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--vs-orange)', color: '#000' }}
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm"
            style={{ borderColor: 'var(--vs-border)' }}
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Visual Stands Design — Stock OS' },
      { name: 'description', content: 'Sistema de Controle de Estoque em Tempo Real' },
      { property: 'og:title', content: 'Visual Stands Design — Stock OS' },
      { property: 'og:type', content: 'website' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-tema="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function LenisProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function AppCore() {
  const { tema, toggleTema } = useStockStore();

  // Sync tema to html attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-tema', tema);
    }
  }, [tema]);

  // Realtime + Presence
  useRealtime();
  usePresence();

  // Konami code → Neon easter egg
  const ativarNeon = useCallback(() => {
    toggleTema();
    if (typeof document === 'undefined') return;
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;background:var(--vs-orange);opacity:0.6;';
    document.body.appendChild(flash);
    gsap.to(flash, { opacity: 0, duration: 0.5, ease: 'power2.out', onComplete: () => flash.remove() });
  }, [toggleTema]);

  useKonamiCode(ativarNeon);

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [booted, setBooted] = useState(false);
  const [tela, setTela] = useState<'login' | 'registro'>('login');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <LenisProvider>
        {/* Fase 1: boot screen (só aparece uma vez) */}
        {!booted && <BootScreen onComplete={() => setBooted(true)} />}

        {/* Fase 2: login ou registro */}
        {booted && !isAuthenticated && tela === 'login' && (
          <LoginScreen onRegistro={() => setTela('registro')} />
        )}
        {booted && !isAuthenticated && tela === 'registro' && (
          <RegistroScreen onVoltar={() => setTela('login')} />
        )}

        {/* Fase 3: app (autenticado) */}
        {booted && isAuthenticated && <AppCore />}

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--vs-surface-2, #1c1c1c)',
              border: '1px solid var(--vs-border, #2a2a2a)',
              color: '#fff',
              fontSize: 13,
            },
          }}
        />
      </LenisProvider>
    </QueryClientProvider>
  );
}
