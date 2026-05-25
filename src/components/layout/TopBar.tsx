import { useStockStore } from '../../store/useStockStore';
import { TerminalCounter } from '../shared/TerminalCounter';
import { Zap } from 'lucide-react';

const TITLES: Record<string, string> = {
  '/':              'Dashboard',
  '/produtos':      'Produtos',
  '/compras':       'Compras',
  '/kits':          'Kits de Produção',
  '/movimentacoes': 'Movimentações',
  '/retornos':      'Retorno de Evento',
  '/necessidades':  'Necessidades',
};

export function TopBar({ pathname }: { pathname: string }) {
  const tema = useStockStore((s) => s.tema);
  const toggleTema = useStockStore((s) => s.toggleTema);
  const title = TITLES[pathname] ?? 'Visual Stands Design';

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between px-6"
      style={{ background: 'var(--vs-surface)', borderBottom: '1px solid var(--vs-border)' }}
    >
      <h1
        className="text-base font-semibold tracking-wide neon-text"
        style={{ color: 'var(--vs-orange)' }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-4">
        <TerminalCounter />

        {/* Tema toggle */}
        <button
          onClick={toggleTema}
          title={tema === 'dark' ? 'Ativar Neon' : 'Desativar Neon'}
          className="rounded-md p-1.5 transition-colors hover:bg-white/5"
          style={{ color: tema === 'neon' ? 'var(--vs-orange)' : 'var(--vs-muted)' }}
        >
          <Zap size={15} fill={tema === 'neon' ? 'var(--vs-orange)' : 'none'} />
        </button>
      </div>
    </header>
  );
}
